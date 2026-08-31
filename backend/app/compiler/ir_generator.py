"""
WICL IR Generator
=================
Stage 5 of the compiler pipeline.

Converts a semantically validated AST node into a flat sequence of
Intermediate Representation (IR) instructions.

IR instructions are low-level, machine-readable operations that abstract
away the high-level WICL syntax and expose the exact sequence of
warehouse operations that must be performed.

IR Instruction Set:
  LOAD_ITEM      <item_code>                  - resolve item entity
  LOAD_WAREHOUSE <warehouse_code>             - resolve warehouse entity
  CHECK_STOCK    <warehouse_code> <item_code> <qty>  - verify sufficient stock
  CHECK_CAPACITY <warehouse_code> <qty>       - verify available capacity
  QUERY_STOCK    <warehouse_code> <item_code> - read-only stock query
  DEBIT          <warehouse_code> <item_code> <qty>  - subtract stock
  CREDIT         <warehouse_code> <item_code> <qty>  - add stock
  SET_STOCK      <warehouse_code> <item_code> <qty>  - set absolute quantity
  BEGIN_TXN      -                            - start ACID transaction
  COMMIT         -                            - commit transaction
  ROLLBACK       -                            - rollback on failure
  RETURN         <info>                       - return read-only result
  AUDIT          <action> <detail>            - write audit record
"""
import time
from dataclasses import dataclass, field
from typing import List, Optional, Any
from .ast_nodes import (
    ASTNode, AddCommandNode, RemoveCommandNode,
    TransferCommandNode, CheckCommandNode, UpdateCommandNode,
)


# ── IR Instruction ─────────────────────────────────────────────────────────────

@dataclass
class IRInstruction:
    """A single IR instruction with opcode and up to 3 operands."""
    opcode: str
    operand1: Optional[str] = None
    operand2: Optional[str] = None
    operand3: Optional[str] = None
    comment: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "opcode": self.opcode,
            "operand1": self.operand1,
            "operand2": self.operand2,
            "operand3": self.operand3,
            "comment": self.comment,
        }

    def to_text(self) -> str:
        """Human-readable single-line representation."""
        parts = [self.opcode]
        if self.operand1 is not None:
            parts.append(str(self.operand1))
        if self.operand2 is not None:
            parts.append(str(self.operand2))
        if self.operand3 is not None:
            parts.append(str(self.operand3))
        line = "  " + "  ".join(parts)
        if self.comment:
            line += f"        ; {self.comment}"
        return line


# ── IR Result ──────────────────────────────────────────────────────────────────

@dataclass
class IRResult:
    """Result of IR generation for a single command."""
    success: bool
    command_type: str
    instructions: List[IRInstruction] = field(default_factory=list)
    error: Optional[str] = None
    generation_time_ms: float = 0.0

    def to_dict(self) -> dict:
        return {
            "status": "success" if self.success else "error",
            "command_type": self.command_type,
            "instruction_count": len(self.instructions),
            "instructions": [i.to_dict() for i in self.instructions],
            "text": self.to_text(),
            "error": self.error,
            "generation_time_ms": round(self.generation_time_ms, 4),
        }

    def to_text(self) -> str:
        """Full IR listing as a formatted text block."""
        lines = [f"; IR for {self.command_type} command"]
        lines.append("; " + "─" * 40)
        for i, instr in enumerate(self.instructions):
            lines.append(f"{i:>3}:  {instr.to_text()}")
        return "\n".join(lines)


# ── IR Generator ───────────────────────────────────────────────────────────────

class IRGenerator:
    """
    Generates IR from a validated WICL AST node.
    Call generate(ast_node) to produce an IRResult.
    """

    def generate(self, ast: ASTNode) -> IRResult:
        t_start = time.perf_counter()
        try:
            if isinstance(ast, AddCommandNode):
                instructions = self._gen_add(ast)
                cmd_type = "ADD"
            elif isinstance(ast, RemoveCommandNode):
                instructions = self._gen_remove(ast)
                cmd_type = "REMOVE"
            elif isinstance(ast, TransferCommandNode):
                instructions = self._gen_transfer(ast)
                cmd_type = "TRANSFER"
            elif isinstance(ast, CheckCommandNode):
                instructions = self._gen_check(ast)
                cmd_type = "CHECK"
            elif isinstance(ast, UpdateCommandNode):
                instructions = self._gen_update(ast)
                cmd_type = "UPDATE"
            else:
                cmd_type = getattr(ast, "node_type", "UNKNOWN")
                return IRResult(
                    success=False,
                    command_type=cmd_type,
                    error=f"No IR template for node type: {cmd_type}",
                    generation_time_ms=(time.perf_counter() - t_start) * 1000,
                )

            elapsed = (time.perf_counter() - t_start) * 1000
            return IRResult(
                success=True,
                command_type=cmd_type,
                instructions=instructions,
                generation_time_ms=round(elapsed, 4),
            )
        except Exception as exc:
            elapsed = (time.perf_counter() - t_start) * 1000
            return IRResult(
                success=False,
                command_type="UNKNOWN",
                error=str(exc),
                generation_time_ms=round(elapsed, 4),
            )

    # ── ADD ────────────────────────────────────────────────────────────────────
    def _gen_add(self, node: AddCommandNode) -> List[IRInstruction]:
        return [
            IRInstruction("BEGIN_TXN", comment="Start ACID transaction"),
            IRInstruction("LOAD_ITEM", node.item_id, comment=f"Resolve item entity: {node.item_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.warehouse_id, comment=f"Resolve warehouse: {node.warehouse_id}"),
            IRInstruction("CHECK_CAPACITY", node.warehouse_id, str(node.quantity),
                          comment=f"Verify {node.warehouse_id} has room for {node.quantity} units"),
            IRInstruction("CREDIT", node.warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Add {node.quantity} × {node.item_id} to {node.warehouse_id}"),
            IRInstruction("AUDIT", "ADD", f"{node.quantity} {node.item_id} → {node.warehouse_id}",
                          comment="Write audit record"),
            IRInstruction("COMMIT", comment="Commit transaction"),
        ]

    # ── REMOVE ─────────────────────────────────────────────────────────────────
    def _gen_remove(self, node: RemoveCommandNode) -> List[IRInstruction]:
        return [
            IRInstruction("BEGIN_TXN", comment="Start ACID transaction"),
            IRInstruction("LOAD_ITEM", node.item_id, comment=f"Resolve item: {node.item_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.warehouse_id, comment=f"Resolve warehouse: {node.warehouse_id}"),
            IRInstruction("CHECK_STOCK", node.warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Verify {node.warehouse_id} holds ≥{node.quantity} of {node.item_id}"),
            IRInstruction("DEBIT", node.warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Remove {node.quantity} × {node.item_id} from {node.warehouse_id}"),
            IRInstruction("AUDIT", "REMOVE", f"{node.quantity} {node.item_id} ← {node.warehouse_id}",
                          comment="Write audit record"),
            IRInstruction("COMMIT", comment="Commit transaction"),
        ]

    # ── TRANSFER ───────────────────────────────────────────────────────────────
    def _gen_transfer(self, node: TransferCommandNode) -> List[IRInstruction]:
        return [
            IRInstruction("BEGIN_TXN", comment="Start ACID transaction"),
            IRInstruction("LOAD_ITEM", node.item_id, comment=f"Resolve item: {node.item_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.source_warehouse_id,
                          comment=f"Resolve source: {node.source_warehouse_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.destination_warehouse_id,
                          comment=f"Resolve destination: {node.destination_warehouse_id}"),
            IRInstruction("CHECK_STOCK", node.source_warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Verify source has ≥{node.quantity} of {node.item_id}"),
            IRInstruction("CHECK_CAPACITY", node.destination_warehouse_id, str(node.quantity),
                          comment=f"Verify destination has room for {node.quantity} units"),
            IRInstruction("DEBIT", node.source_warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Deduct from {node.source_warehouse_id}"),
            IRInstruction("CREDIT", node.destination_warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Credit to {node.destination_warehouse_id}"),
            IRInstruction("AUDIT", "TRANSFER",
                          f"{node.quantity} {node.item_id}: {node.source_warehouse_id}→{node.destination_warehouse_id}",
                          comment="Write audit record"),
            IRInstruction("COMMIT", comment="Commit transaction"),
        ]

    # ── CHECK ──────────────────────────────────────────────────────────────────
    def _gen_check(self, node: CheckCommandNode) -> List[IRInstruction]:
        return [
            IRInstruction("LOAD_ITEM", node.item_id, comment=f"Resolve item: {node.item_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.warehouse_id, comment=f"Resolve warehouse: {node.warehouse_id}"),
            IRInstruction("QUERY_STOCK", node.warehouse_id, node.item_id,
                          comment=f"Read stock level of {node.item_id} in {node.warehouse_id}"),
            IRInstruction("RETURN", "STOCK_LEVEL", comment="Return read-only result — no DB mutation"),
        ]

    # ── UPDATE ─────────────────────────────────────────────────────────────────
    def _gen_update(self, node: UpdateCommandNode) -> List[IRInstruction]:
        return [
            IRInstruction("BEGIN_TXN", comment="Start ACID transaction"),
            IRInstruction("LOAD_ITEM", node.item_id, comment=f"Resolve item: {node.item_id}"),
            IRInstruction("LOAD_WAREHOUSE", node.warehouse_id, comment=f"Resolve warehouse: {node.warehouse_id}"),
            IRInstruction("SET_STOCK", node.warehouse_id, node.item_id, str(node.quantity),
                          comment=f"Override stock to {node.quantity} units"),
            IRInstruction("AUDIT", "UPDATE", f"{node.item_id} @ {node.warehouse_id} → {node.quantity}",
                          comment="Write audit record"),
            IRInstruction("COMMIT", comment="Commit transaction"),
        ]
