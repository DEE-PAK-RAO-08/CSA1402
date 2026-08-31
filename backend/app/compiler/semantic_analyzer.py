"""
WICL Semantic Analyzer
======================
Validates a parsed AST against actual database state.
Checks business rules, inventory availability, and warehouse constraints.

The semantic analyzer NEVER modifies the database.
It only reads state to validate correctness.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .ast_nodes import (
    ASTNode, AddCommandNode, RemoveCommandNode,
    TransferCommandNode, CheckCommandNode, UpdateCommandNode, CommandType
)
from .error_handler import CompilerError, ErrorStage, ErrorCode


class SemanticCheck:
    """Result of a single semantic validation check."""
    def __init__(self, rule: str, description: str, passed: bool,
                 detail: Optional[str] = None, error: Optional[CompilerError] = None):
        self.rule = rule
        self.description = description
        self.passed = passed
        self.detail = detail
        self.error = error

    def to_dict(self) -> dict:
        return {
            "rule": self.rule,
            "description": self.description,
            "passed": self.passed,
            "detail": self.detail,
            "error": self.error.to_dict() if self.error else None,
        }


class SemanticResult:
    def __init__(self, checks: List[SemanticCheck], errors: List[CompilerError],
                 context: Optional[Dict[str, Any]] = None):
        self.checks = checks
        self.errors = errors
        self.context = context or {}
        self.success = all(c.passed for c in checks) and len(errors) == 0

    def to_dict(self) -> dict:
        return {
            "status": "success" if self.success else "error",
            "checks": [c.to_dict() for c in self.checks],
            "errors": [e.to_dict() for e in self.errors],
            "context": self.context,
        }


class SemanticAnalyzer:
    """
    Performs semantic analysis on a parsed AST.

    Rules enforced:
      SEM001 — Item must exist
      SEM002 — Warehouse must exist
      SEM003 — Quantity must be > 0
      SEM004 — Sufficient stock (REMOVE / TRANSFER)
      SEM005 — Source ≠ Destination (TRANSFER)
      SEM006 — Destination capacity not exceeded (ADD / TRANSFER)
      SEM007 — Item exists in source warehouse (TRANSFER / REMOVE)
      SEM008 — User authorized for warehouse
    """

    def analyze(self, ast: ASTNode, db: Session, user_id: int,
                user_role: str, user_warehouse_id: Optional[int]) -> SemanticResult:
        """Dispatch to the correct rule-set based on command type."""
        from ..database import models

        checks: List[SemanticCheck] = []
        errors: List[CompilerError] = []
        context: Dict[str, Any] = {}

        node_type = ast.node_type

        if node_type == "ADD_COMMAND":
            return self._analyze_add(ast, db, user_id, user_role, user_warehouse_id, models)
        elif node_type == "REMOVE_COMMAND":
            return self._analyze_remove(ast, db, user_id, user_role, user_warehouse_id, models)
        elif node_type == "TRANSFER_COMMAND":
            return self._analyze_transfer(ast, db, user_id, user_role, user_warehouse_id, models)
        elif node_type == "CHECK_COMMAND":
            return self._analyze_check(ast, db, user_id, user_role, user_warehouse_id, models)
        elif node_type == "UPDATE_COMMAND":
            return self._analyze_update(ast, db, user_id, user_role, user_warehouse_id, models)

        errors.append(CompilerError(
            stage=ErrorStage.SEMANTIC,
            error_code=ErrorCode.SEM001,
            message=f"Unknown AST node type: {node_type}",
        ))
        return SemanticResult(checks=[], errors=errors)

    # ── ADD ────────────────────────────────────────────────────────────────

    def _analyze_add(self, node: AddCommandNode, db, user_id, user_role, user_wh_id, models) -> SemanticResult:
        checks, errors, context = [], [], {}

        item = self._get_item(node.item_id, db, models)
        checks.append(SemanticCheck("SEM001", f"Item '{node.item_id}' exists",
                                    item is not None,
                                    detail=f"Item: {item.item_name if item else 'NOT FOUND'}",
                                    error=None if item else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM001,
                                        f"Item '{node.item_id}' does not exist in the system",
                                        suggestion=f"Check the item code. Valid items are visible on the Items page.")))
        if item:
            context["item"] = {"id": item.id, "code": item.item_code, "name": item.item_name}

        wh = self._get_warehouse(node.warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Warehouse '{node.warehouse_id}' exists",
                                    wh is not None,
                                    detail=f"Warehouse: {wh.name if wh else 'NOT FOUND'}",
                                    error=None if wh else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Warehouse '{node.warehouse_id}' does not exist",
                                        suggestion="Check the warehouse code. Valid warehouses: WH01, WH02, WH03, WH04")))
        if wh:
            context["warehouse"] = {"id": wh.id, "code": wh.warehouse_code, "name": wh.name,
                                    "capacity": wh.capacity}

        qty_ok = node.quantity > 0
        checks.append(SemanticCheck("SEM003", "Quantity is positive",
                                    qty_ok,
                                    detail=f"Quantity: {node.quantity}",
                                    error=None if qty_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM003,
                                        f"Quantity must be > 0, got {node.quantity}",
                                        suggestion="Use a positive integer for quantity.")))

        if item and wh and qty_ok:
            current_stock = self._get_stock(item.id, wh.id, db, models)
            total_after = current_stock + node.quantity
            capacity_ok = total_after <= wh.capacity
            checks.append(SemanticCheck("SEM006",
                                        f"Destination capacity available ({wh.capacity} max)",
                                        capacity_ok,
                                        detail=f"Current: {current_stock}, Adding: {node.quantity}, "
                                               f"Total: {total_after}, Capacity: {wh.capacity}",
                                        error=None if capacity_ok else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM006,
                                            f"Adding {node.quantity} units would exceed warehouse capacity "
                                            f"({total_after} > {wh.capacity})",
                                            suggestion=f"Reduce quantity to at most {wh.capacity - current_stock} units.")))
            context["current_stock"] = current_stock
            context["stock_after"] = total_after

        auth_ok = self._check_auth(user_role, user_wh_id, wh, "ADD")
        checks.append(SemanticCheck("SEM008", "User authorized for this warehouse",
                                    auth_ok,
                                    detail=f"Role: {user_role}",
                                    error=None if auth_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM008,
                                        "User is not authorized to operate on this warehouse",
                                        suggestion="Contact your administrator to get warehouse access.")))

        errors = [c.error for c in checks if not c.passed and c.error]
        return SemanticResult(checks=checks, errors=errors, context=context)

    # ── REMOVE ─────────────────────────────────────────────────────────────

    def _analyze_remove(self, node: RemoveCommandNode, db, user_id, user_role, user_wh_id, models) -> SemanticResult:
        checks, errors, context = [], [], {}

        item = self._get_item(node.item_id, db, models)
        checks.append(SemanticCheck("SEM001", f"Item '{node.item_id}' exists",
                                    item is not None,
                                    detail=f"Item: {item.item_name if item else 'NOT FOUND'}",
                                    error=None if item else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM001,
                                        f"Item '{node.item_id}' does not exist")))
        if item:
            context["item"] = {"id": item.id, "code": item.item_code, "name": item.item_name}

        wh = self._get_warehouse(node.warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Warehouse '{node.warehouse_id}' exists",
                                    wh is not None,
                                    detail=f"Warehouse: {wh.name if wh else 'NOT FOUND'}",
                                    error=None if wh else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Warehouse '{node.warehouse_id}' does not exist")))
        if wh:
            context["warehouse"] = {"id": wh.id, "code": wh.warehouse_code, "name": wh.name}

        qty_ok = node.quantity > 0
        checks.append(SemanticCheck("SEM003", "Quantity is positive",
                                    qty_ok,
                                    detail=f"Quantity: {node.quantity}",
                                    error=None if qty_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM003,
                                        f"Quantity must be > 0, got {node.quantity}",
                                        suggestion="Use a positive integer.")))

        if item and wh:
            stock = self._get_stock(item.id, wh.id, db, models)
            context["current_stock"] = stock
            context["stock_after"] = stock - node.quantity

            item_in_wh = stock > 0
            checks.append(SemanticCheck("SEM007", f"Item '{node.item_id}' exists in '{node.warehouse_id}'",
                                        item_in_wh,
                                        detail=f"Current stock: {stock}",
                                        error=None if item_in_wh else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM007,
                                            f"Item '{node.item_id}' has no stock at '{node.warehouse_id}'")))

            if qty_ok and item_in_wh:
                sufficient = stock >= node.quantity
                checks.append(SemanticCheck("SEM004",
                                            f"Sufficient stock (have {stock}, need {node.quantity})",
                                            sufficient,
                                            detail=f"Available: {stock}, Requested: {node.quantity}",
                                            error=None if sufficient else CompilerError(
                                                ErrorStage.SEMANTIC, ErrorCode.SEM004,
                                                f"Insufficient stock. Available: {stock}, Requested: {node.quantity}",
                                                suggestion=f"Reduce quantity to at most {stock} units.")))

        auth_ok = self._check_auth(user_role, user_wh_id, wh, "REMOVE")
        checks.append(SemanticCheck("SEM008", "User authorized", auth_ok,
                                    detail=f"Role: {user_role}",
                                    error=None if auth_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM008,
                                        "Not authorized for this warehouse")))

        errors = [c.error for c in checks if not c.passed and c.error]
        return SemanticResult(checks=checks, errors=errors, context=context)

    # ── TRANSFER ───────────────────────────────────────────────────────────

    def _analyze_transfer(self, node: TransferCommandNode, db, user_id, user_role, user_wh_id, models) -> SemanticResult:
        checks, errors, context = [], [], {}

        item = self._get_item(node.item_id, db, models)
        checks.append(SemanticCheck("SEM001", f"Item '{node.item_id}' exists",
                                    item is not None, detail=f"Item: {item.item_name if item else 'NOT FOUND'}",
                                    error=None if item else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM001,
                                        f"Item '{node.item_id}' does not exist")))
        if item:
            context["item"] = {"id": item.id, "code": item.item_code, "name": item.item_name}

        src = self._get_warehouse(node.source_warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Source warehouse '{node.source_warehouse_id}' exists",
                                    src is not None, detail=f"Warehouse: {src.name if src else 'NOT FOUND'}",
                                    error=None if src else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Source warehouse '{node.source_warehouse_id}' does not exist")))

        dst = self._get_warehouse(node.destination_warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Destination warehouse '{node.destination_warehouse_id}' exists",
                                    dst is not None, detail=f"Warehouse: {dst.name if dst else 'NOT FOUND'}",
                                    error=None if dst else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Destination warehouse '{node.destination_warehouse_id}' does not exist")))

        # Rule: source ≠ destination
        if src and dst:
            not_same = src.id != dst.id
            checks.append(SemanticCheck("SEM005", "Source and destination are different",
                                        not_same,
                                        detail=f"{node.source_warehouse_id} → {node.destination_warehouse_id}",
                                        error=None if not_same else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM005,
                                            "Source and destination warehouses cannot be the same",
                                            suggestion="Choose different source and destination warehouses.")))
            context["source"] = {"id": src.id, "code": src.warehouse_code, "name": src.name}
            context["destination"] = {"id": dst.id, "code": dst.warehouse_code, "name": dst.name,
                                      "capacity": dst.capacity}

        qty_ok = node.quantity > 0
        checks.append(SemanticCheck("SEM003", "Quantity is positive", qty_ok,
                                    detail=f"Quantity: {node.quantity}",
                                    error=None if qty_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM003,
                                        f"Quantity must be > 0, got {node.quantity}")))

        if item and src and dst and qty_ok:
            src_stock = self._get_stock(item.id, src.id, db, models)
            dst_stock = self._get_stock(item.id, dst.id, db, models)
            context["source_stock"] = src_stock
            context["destination_stock"] = dst_stock
            context["source_stock_after"] = src_stock - node.quantity
            context["destination_stock_after"] = dst_stock + node.quantity

            item_in_src = src_stock > 0
            checks.append(SemanticCheck("SEM007", f"Item present in source '{node.source_warehouse_id}'",
                                        item_in_src, detail=f"Stock at source: {src_stock}",
                                        error=None if item_in_src else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM007,
                                            f"Item '{node.item_id}' has no stock in '{node.source_warehouse_id}'")))

            sufficient = src_stock >= node.quantity
            checks.append(SemanticCheck("SEM004",
                                        f"Sufficient stock in source (have {src_stock}, need {node.quantity})",
                                        sufficient, detail=f"Available: {src_stock}, Requested: {node.quantity}",
                                        error=None if sufficient else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM004,
                                            f"Insufficient stock. Available: {src_stock}, Requested: {node.quantity}",
                                            suggestion=f"Reduce quantity to at most {src_stock} units.")))

            dst_total = dst_stock + node.quantity
            cap_ok = dst_total <= dst.capacity
            checks.append(SemanticCheck("SEM006",
                                        f"Destination capacity available ({dst.capacity} max)",
                                        cap_ok,
                                        detail=f"Dst current: {dst_stock}, Adding: {node.quantity}, "
                                               f"Total: {dst_total}, Capacity: {dst.capacity}",
                                        error=None if cap_ok else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM006,
                                            f"Transfer would exceed destination capacity "
                                            f"({dst_total} > {dst.capacity})",
                                            suggestion=f"Reduce quantity to at most {dst.capacity - dst_stock} units.")))

        auth_ok = self._check_auth(user_role, user_wh_id, src, "TRANSFER")
        checks.append(SemanticCheck("SEM008", "User authorized", auth_ok,
                                    detail=f"Role: {user_role}",
                                    error=None if auth_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM008,
                                        "Not authorized for source warehouse")))

        errors = [c.error for c in checks if not c.passed and c.error]
        return SemanticResult(checks=checks, errors=errors, context=context)

    # ── CHECK ──────────────────────────────────────────────────────────────

    def _analyze_check(self, node: CheckCommandNode, db, user_id, user_role, user_wh_id, models) -> SemanticResult:
        checks, errors, context = [], [], {}

        item = self._get_item(node.item_id, db, models)
        checks.append(SemanticCheck("SEM001", f"Item '{node.item_id}' exists",
                                    item is not None, detail=f"Item: {item.item_name if item else 'NOT FOUND'}",
                                    error=None if item else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM001,
                                        f"Item '{node.item_id}' does not exist")))
        if item:
            context["item"] = {"id": item.id, "code": item.item_code, "name": item.item_name}

        wh = self._get_warehouse(node.warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Warehouse '{node.warehouse_id}' exists",
                                    wh is not None, detail=f"Warehouse: {wh.name if wh else 'NOT FOUND'}",
                                    error=None if wh else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Warehouse '{node.warehouse_id}' does not exist")))
        if wh:
            context["warehouse"] = {"id": wh.id, "code": wh.warehouse_code, "name": wh.name}

        if item and wh:
            stock = self._get_stock(item.id, wh.id, db, models)
            context["current_stock"] = stock
            context["warehouse_capacity"] = wh.capacity

        errors = [c.error for c in checks if not c.passed and c.error]
        return SemanticResult(checks=checks, errors=errors, context=context)

    # ── UPDATE ─────────────────────────────────────────────────────────────

    def _analyze_update(self, node: UpdateCommandNode, db, user_id, user_role, user_wh_id, models) -> SemanticResult:
        checks, errors, context = [], [], {}

        item = self._get_item(node.item_id, db, models)
        checks.append(SemanticCheck("SEM001", f"Item '{node.item_id}' exists",
                                    item is not None, detail=f"Item: {item.item_name if item else 'NOT FOUND'}",
                                    error=None if item else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM001,
                                        f"Item '{node.item_id}' does not exist")))
        if item:
            context["item"] = {"id": item.id, "code": item.item_code, "name": item.item_name}

        wh = self._get_warehouse(node.warehouse_id, db, models)
        checks.append(SemanticCheck("SEM002", f"Warehouse '{node.warehouse_id}' exists",
                                    wh is not None, detail=f"Warehouse: {wh.name if wh else 'NOT FOUND'}",
                                    error=None if wh else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM002,
                                        f"Warehouse '{node.warehouse_id}' does not exist")))
        if wh:
            context["warehouse"] = {"id": wh.id, "code": wh.warehouse_code, "name": wh.name,
                                    "capacity": wh.capacity}

        qty_ok = node.quantity >= 0
        checks.append(SemanticCheck("SEM003", "Quantity is non-negative", qty_ok,
                                    detail=f"New quantity: {node.quantity}",
                                    error=None if qty_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM003,
                                        f"Quantity cannot be negative, got {node.quantity}")))

        if wh and qty_ok:
            cap_ok = node.quantity <= wh.capacity
            checks.append(SemanticCheck("SEM006", f"Quantity within capacity ({wh.capacity})",
                                        cap_ok,
                                        detail=f"New quantity: {node.quantity}, Capacity: {wh.capacity}",
                                        error=None if cap_ok else CompilerError(
                                            ErrorStage.SEMANTIC, ErrorCode.SEM006,
                                            f"New quantity {node.quantity} exceeds warehouse capacity {wh.capacity}")))
            if item:
                current_stock = self._get_stock(item.id, wh.id, db, models)
                context["current_stock"] = current_stock
                context["stock_after"] = node.quantity

        auth_ok = self._check_auth(user_role, user_wh_id, wh, "UPDATE")
        checks.append(SemanticCheck("SEM008", "User authorized", auth_ok,
                                    detail=f"Role: {user_role}",
                                    error=None if auth_ok else CompilerError(
                                        ErrorStage.SEMANTIC, ErrorCode.SEM008,
                                        "Not authorized for this warehouse")))

        errors = [c.error for c in checks if not c.passed and c.error]
        return SemanticResult(checks=checks, errors=errors, context=context)

    # ── DB Helpers ──────────────────────────────────────────────────────────

    def _get_item(self, item_code: str, db: Session, models):
        return db.query(models.Item).filter(
            models.Item.item_code == item_code.upper(),
            models.Item.status == "active"
        ).first()

    def _get_warehouse(self, wh_code: str, db: Session, models):
        return db.query(models.Warehouse).filter(
            models.Warehouse.warehouse_code == wh_code.upper(),
            models.Warehouse.status == "active"
        ).first()

    def _get_stock(self, item_id: int, wh_id: int, db: Session, models) -> int:
        inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == wh_id
        ).first()
        return inv.quantity if inv else 0

    def _check_auth(self, user_role: str, user_wh_id: Optional[int], wh, operation: str) -> bool:
        """
        Admin: can do anything.
        Operator: can operate on their assigned warehouse.
        Viewer: cannot execute modifying operations.
        """
        if user_role == "admin":
            return True
        if user_role == "viewer":
            return operation == "CHECK"  # viewers can only check
        if user_role == "operator":
            if wh is None:
                return False
            if user_wh_id is None:
                return False
            return user_wh_id == wh.id
        return False
