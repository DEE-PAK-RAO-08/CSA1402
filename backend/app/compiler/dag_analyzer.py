"""
WICL Dependency Analyzer & DAG Generator
=========================================
Stage 7 of the compiler pipeline.

Performs data dependency analysis across commands (or internal operations of a batch).
Constructs a Directed Acyclic Graph (DAG) that dictates safe, deadlock-free
execution order while preserving ACID transaction semantics and audit ordering.

Dependency Types:
  - RAW (Read-After-Write): Command B reads inventory modified by Command A
  - WAW (Write-After-Write): Command B modifies inventory modified by Command A
  - WAR (Write-After-Read): Command B modifies inventory read by Command A
  - INDEPENDENT: No shared resource conflict; commands can execute in parallel
"""
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
from .ast_nodes import (
    ASTNode, AddCommandNode, RemoveCommandNode,
    TransferCommandNode, CheckCommandNode, UpdateCommandNode
)


@dataclass
class DAGNode:
    """A node in the execution DAG representing one command."""
    id: int
    command_type: str
    raw_command: str
    item_id: Optional[str]
    warehouses: List[str]
    is_mutation: bool

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "command_type": self.command_type,
            "raw_command": self.raw_command,
            "item_id": self.item_id,
            "warehouses": self.warehouses,
            "is_mutation": self.is_mutation,
        }


@dataclass
class DAGEdge:
    """A directed dependency edge between two commands (from_id → to_id)."""
    from_id: int
    to_id: int
    dependency_type: str  # RAW, WAW, WAR
    reason: str

    def to_dict(self) -> dict:
        return {
            "from_id": self.from_id,
            "to_id": self.to_id,
            "dependency_type": self.dependency_type,
            "reason": self.reason,
        }


@dataclass
class DAGResult:
    """Result of DAG analysis."""
    nodes: List[DAGNode] = field(default_factory=list)
    edges: List[DAGEdge] = field(default_factory=list)
    execution_order: List[int] = field(default_factory=list)
    independent_groups: List[List[int]] = field(default_factory=list)
    is_valid_dag: bool = True
    analysis_time_ms: float = 0.0

    def to_dict(self) -> dict:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "execution_order": self.execution_order,
            "independent_groups": self.independent_groups,
            "is_valid_dag": self.is_valid_dag,
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "analysis_time_ms": round(self.analysis_time_ms, 4),
            "ascii_graph": self.to_ascii(),
        }

    def to_ascii(self) -> str:
        """ASCII graph representation for UI display."""
        if not self.nodes:
            return "Empty DAG"

        lines = ["=== DAG Execution Plan ==="]
        for g_idx, group in enumerate(self.independent_groups):
            cmds = [f"CMD#{nid}" for nid in group]
            lines.append(f"Stage {g_idx + 1} (Parallel Group): [ {', '.join(cmds)} ]")

        if self.edges:
            lines.append("\n=== Dependencies ===")
            for edge in self.edges:
                lines.append(f"  CMD#{edge.from_id} ──({edge.dependency_type})──> CMD#{edge.to_id} : {edge.reason}")

        return "\n".join(lines)


class DAGAnalyzer:
    """
    Analyzes list of parsed AST nodes (from batch or single command)
    and constructs execution DAG.
    """

    def analyze(self, ast_items: List[Dict[str, Any]]) -> DAGResult:
        """
        ast_items: List of dicts, each with:
           {"id": int, "raw_command": str, "ast": ASTNode}
        """
        t_start = time.perf_counter()

        nodes: List[DAGNode] = []
        for idx, item in enumerate(ast_items, start=1):
            cmd_id = item.get("id", idx)
            raw = item.get("raw_command", "")
            ast = item.get("ast")

            node_info = self._extract_node_info(cmd_id, raw, ast)
            nodes.append(node_info)

        # Detect dependency edges
        edges: List[DAGEdge] = []
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                n1 = nodes[i]
                n2 = nodes[j]

                # Check resource overlap
                shared_item = n1.item_id == n2.item_id if (n1.item_id and n2.item_id) else False
                shared_wh = bool(set(n1.warehouses) & set(n2.warehouses))

                if shared_wh or shared_item:
                    reason_parts = []
                    if shared_item:
                        reason_parts.append(f"Item '{n1.item_id}'")
                    if shared_wh:
                        wh_match = list(set(n1.warehouses) & set(n2.warehouses))
                        reason_parts.append(f"Warehouse(s) {', '.join(wh_match)}")
                    reason = " & ".join(reason_parts)

                    if n1.is_mutation and not n2.is_mutation:
                        edges.append(DAGEdge(n1.id, n2.id, "RAW", f"Read after Write on {reason}"))
                    elif n1.is_mutation and n2.is_mutation:
                        edges.append(DAGEdge(n1.id, n2.id, "WAW", f"Write after Write on {reason}"))
                    elif not n1.is_mutation and n2.is_mutation:
                        edges.append(DAGEdge(n1.id, n2.id, "WAR", f"Write after Read on {reason}"))

        # Topological Sort & Parallel Grouping
        in_degree = {n.id: 0 for n in nodes}
        adj = {n.id: [] for n in nodes}
        for e in edges:
            adj[e.from_id].append(e.to_id)
            in_degree[e.to_id] += 1

        execution_order = []
        groups = []

        ready = [nid for nid, deg in in_degree.items() if deg == 0]
        while ready:
            groups.append(sorted(ready))
            execution_order.extend(sorted(ready))
            next_ready = []
            for u in ready:
                for v in adj[u]:
                    in_degree[v] -= 1
                    if in_degree[v] == 0:
                        next_ready.append(v)
            ready = next_ready

        is_valid = len(execution_order) == len(nodes)
        elapsed = (time.perf_counter() - t_start) * 1000

        return DAGResult(
            nodes=nodes,
            edges=edges,
            execution_order=execution_order if is_valid else [n.id for n in nodes],
            independent_groups=groups if is_valid else [[n.id] for n in nodes],
            is_valid_dag=is_valid,
            analysis_time_ms=round(elapsed, 4),
        )

    def _extract_node_info(self, cmd_id: int, raw: str, ast: Any) -> DAGNode:
        if isinstance(ast, AddCommandNode):
            return DAGNode(cmd_id, "ADD", raw, ast.item_id, [ast.warehouse_id], is_mutation=True)
        elif isinstance(ast, RemoveCommandNode):
            return DAGNode(cmd_id, "REMOVE", raw, ast.item_id, [ast.warehouse_id], is_mutation=True)
        elif isinstance(ast, TransferCommandNode):
            return DAGNode(cmd_id, "TRANSFER", raw, ast.item_id,
                           [ast.source_warehouse_id, ast.destination_warehouse_id], is_mutation=True)
        elif isinstance(ast, CheckCommandNode):
            return DAGNode(cmd_id, "CHECK", raw, ast.item_id, [ast.warehouse_id], is_mutation=False)
        elif isinstance(ast, UpdateCommandNode):
            return DAGNode(cmd_id, "UPDATE", raw, ast.item_id, [ast.warehouse_id], is_mutation=True)
        else:
            return DAGNode(cmd_id, "UNKNOWN", raw, None, [], is_mutation=False)
