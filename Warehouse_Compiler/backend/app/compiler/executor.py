"""
WICL Execution Engine
=====================
Receives only fully validated commands (past all compiler stages).
Performs safe database transactions with BEGIN / COMMIT / ROLLBACK semantics.

The executor NEVER receives raw commands — only validated AST nodes + context.
"""
import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from .ast_nodes import (
    ASTNode, AddCommandNode, RemoveCommandNode,
    TransferCommandNode, CheckCommandNode, UpdateCommandNode
)
from .error_handler import CompilerError, ErrorStage, ErrorCode


class ExecutionResult:
    def __init__(
        self,
        success: bool,
        operation: str,
        transaction_id: Optional[int],
        message: str,
        inventory_changes: Optional[Dict[str, Any]] = None,
        error: Optional[CompilerError] = None,
    ):
        self.success = success
        self.operation = operation
        self.transaction_id = transaction_id
        self.message = message
        self.inventory_changes = inventory_changes or {}
        self.error = error

    def to_dict(self) -> dict:
        return {
            "status": "success" if self.success else "error",
            "operation": self.operation,
            "transaction_id": self.transaction_id,
            "message": self.message,
            "inventory_changes": self.inventory_changes,
            "error": self.error.to_dict() if self.error else None,
        }


class ExecutionEngine:
    """
    Transactional execution engine.
    All database operations use SQLAlchemy sessions with explicit commit/rollback.
    """

    def execute(
        self,
        ast: ASTNode,
        command_id: int,
        user_id: int,
        db: Session,
        semantic_context: Dict[str, Any],
    ) -> ExecutionResult:
        from ..database import models

        try:
            node_type = ast.node_type

            if node_type == "ADD_COMMAND":
                return self._execute_add(ast, command_id, user_id, db, models, semantic_context)
            elif node_type == "REMOVE_COMMAND":
                return self._execute_remove(ast, command_id, user_id, db, models, semantic_context)
            elif node_type == "TRANSFER_COMMAND":
                return self._execute_transfer(ast, command_id, user_id, db, models, semantic_context)
            elif node_type == "CHECK_COMMAND":
                return self._execute_check(ast, command_id, user_id, db, models, semantic_context)
            elif node_type == "UPDATE_COMMAND":
                return self._execute_update(ast, command_id, user_id, db, models, semantic_context)

            return ExecutionResult(
                success=False,
                operation="UNKNOWN",
                transaction_id=None,
                message="Unknown command type",
                error=CompilerError(ErrorStage.EXECUTION, ErrorCode.EXE001, "Unknown AST node type"),
            )
        except Exception as exc:
            db.rollback()
            return ExecutionResult(
                success=False,
                operation=ast.node_type,
                transaction_id=None,
                message=f"Execution failed: {str(exc)}",
                error=CompilerError(ErrorStage.EXECUTION, ErrorCode.EXE001, str(exc)),
            )

    # ── ADD ────────────────────────────────────────────────────────────────

    def _execute_add(self, node: AddCommandNode, command_id, user_id, db, models, ctx) -> ExecutionResult:
        item_id = ctx["item"]["id"]
        wh_id = ctx["warehouse"]["id"]
        before = ctx.get("current_stock", 0)

        inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == wh_id
        ).first()

        if inv:
            inv.quantity += node.quantity
            inv.updated_at = datetime.datetime.utcnow()
        else:
            inv = models.Inventory(item_id=item_id, warehouse_id=wh_id, quantity=node.quantity)
            db.add(inv)

        txn = models.Transaction(
            command_id=command_id,
            user_id=user_id,
            item_id=item_id,
            destination_warehouse_id=wh_id,
            quantity=node.quantity,
            transaction_type="ADD",
            status="completed",
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return ExecutionResult(
            success=True,
            operation="ADD",
            transaction_id=txn.id,
            message=f"Successfully added {node.quantity} units of {node.item_id} to {node.warehouse_id}",
            inventory_changes={
                "warehouse": node.warehouse_id,
                "item": node.item_id,
                "before": before,
                "after": before + node.quantity,
                "change": +node.quantity,
            },
        )

    # ── REMOVE ─────────────────────────────────────────────────────────────

    def _execute_remove(self, node: RemoveCommandNode, command_id, user_id, db, models, ctx) -> ExecutionResult:
        item_id = ctx["item"]["id"]
        wh_id = ctx["warehouse"]["id"]
        before = ctx.get("current_stock", 0)

        inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == wh_id
        ).first()

        inv.quantity -= node.quantity
        inv.updated_at = datetime.datetime.utcnow()

        txn = models.Transaction(
            command_id=command_id,
            user_id=user_id,
            item_id=item_id,
            source_warehouse_id=wh_id,
            quantity=node.quantity,
            transaction_type="REMOVE",
            status="completed",
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return ExecutionResult(
            success=True,
            operation="REMOVE",
            transaction_id=txn.id,
            message=f"Successfully removed {node.quantity} units of {node.item_id} from {node.warehouse_id}",
            inventory_changes={
                "warehouse": node.warehouse_id,
                "item": node.item_id,
                "before": before,
                "after": before - node.quantity,
                "change": -node.quantity,
            },
        )

    # ── TRANSFER ───────────────────────────────────────────────────────────

    def _execute_transfer(self, node: TransferCommandNode, command_id, user_id, db, models, ctx) -> ExecutionResult:
        item_id = ctx["item"]["id"]
        src_id = ctx["source"]["id"]
        dst_id = ctx["destination"]["id"]
        src_before = ctx.get("source_stock", 0)
        dst_before = ctx.get("destination_stock", 0)

        # BEGIN TRANSACTION (implicit with SQLAlchemy session)
        src_inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == src_id
        ).first()

        dst_inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == dst_id
        ).first()

        src_inv.quantity -= node.quantity
        src_inv.updated_at = datetime.datetime.utcnow()

        if dst_inv:
            dst_inv.quantity += node.quantity
            dst_inv.updated_at = datetime.datetime.utcnow()
        else:
            dst_inv = models.Inventory(
                item_id=item_id, warehouse_id=dst_id, quantity=node.quantity
            )
            db.add(dst_inv)

        txn = models.Transaction(
            command_id=command_id,
            user_id=user_id,
            item_id=item_id,
            source_warehouse_id=src_id,
            destination_warehouse_id=dst_id,
            quantity=node.quantity,
            transaction_type="TRANSFER",
            status="completed",
        )
        db.add(txn)
        db.commit()  # COMMIT
        db.refresh(txn)

        return ExecutionResult(
            success=True,
            operation="TRANSFER",
            transaction_id=txn.id,
            message=f"Transferred {node.quantity} units of {node.item_id} from {node.source_warehouse_id} to {node.destination_warehouse_id}",
            inventory_changes={
                "item": node.item_id,
                "source": {"warehouse": node.source_warehouse_id, "before": src_before, "after": src_before - node.quantity},
                "destination": {"warehouse": node.destination_warehouse_id, "before": dst_before, "after": dst_before + node.quantity},
                "quantity_transferred": node.quantity,
            },
        )

    # ── CHECK ──────────────────────────────────────────────────────────────

    def _execute_check(self, node: CheckCommandNode, command_id, user_id, db, models, ctx) -> ExecutionResult:
        stock = ctx.get("current_stock", 0)
        cap = ctx.get("warehouse_capacity", 0)

        txn = models.Transaction(
            command_id=command_id,
            user_id=user_id,
            item_id=ctx["item"]["id"] if "item" in ctx else None,
            destination_warehouse_id=ctx["warehouse"]["id"] if "warehouse" in ctx else None,
            quantity=stock,
            transaction_type="CHECK",
            status="completed",
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return ExecutionResult(
            success=True,
            operation="CHECK",
            transaction_id=txn.id,
            message=f"Stock check: {node.item_id} at {node.warehouse_id} = {stock} units",
            inventory_changes={
                "item": node.item_id,
                "warehouse": node.warehouse_id,
                "current_stock": stock,
                "capacity": cap,
                "utilization_pct": round((stock / cap * 100) if cap > 0 else 0, 1),
            },
        )

    # ── UPDATE ─────────────────────────────────────────────────────────────

    def _execute_update(self, node: UpdateCommandNode, command_id, user_id, db, models, ctx) -> ExecutionResult:
        item_id = ctx["item"]["id"]
        wh_id = ctx["warehouse"]["id"]
        before = ctx.get("current_stock", 0)

        inv = db.query(models.Inventory).filter(
            models.Inventory.item_id == item_id,
            models.Inventory.warehouse_id == wh_id
        ).first()

        if inv:
            inv.quantity = node.quantity
            inv.updated_at = datetime.datetime.utcnow()
        else:
            inv = models.Inventory(item_id=item_id, warehouse_id=wh_id, quantity=node.quantity)
            db.add(inv)

        txn = models.Transaction(
            command_id=command_id,
            user_id=user_id,
            item_id=item_id,
            destination_warehouse_id=wh_id,
            quantity=node.quantity,
            transaction_type="UPDATE",
            status="completed",
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return ExecutionResult(
            success=True,
            operation="UPDATE",
            transaction_id=txn.id,
            message=f"Updated {node.item_id} at {node.warehouse_id}: {before} → {node.quantity}",
            inventory_changes={
                "warehouse": node.warehouse_id,
                "item": node.item_id,
                "before": before,
                "after": node.quantity,
                "change": node.quantity - before,
            },
        )
