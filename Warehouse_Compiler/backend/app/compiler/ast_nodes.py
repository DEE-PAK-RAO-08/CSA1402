"""
WICL AST Node Definitions
=========================
Abstract Syntax Tree nodes for all WICL command types.
Each node carries the structured data extracted by the parser.
"""
from dataclasses import dataclass, field
from typing import Optional, List, Any
from enum import Enum


class CommandType(str, Enum):
    ADD = "ADD"
    REMOVE = "REMOVE"
    TRANSFER = "TRANSFER"
    CHECK = "CHECK"
    UPDATE = "UPDATE"


@dataclass
class ASTNode:
    """Base class for all AST nodes."""

    def to_dict(self) -> dict:
        raise NotImplementedError


@dataclass
class AddCommandNode(ASTNode):
    """ADD ITEM <item_id> QUANTITY <n> LOCATION <warehouse_id>"""
    item_id: str
    quantity: int
    warehouse_id: str
    node_type: str = "ADD_COMMAND"

    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "operation": CommandType.ADD.value,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "warehouse_id": self.warehouse_id,
            "children": [
                {"label": "ITEM", "children": [{"label": self.item_id}]},
                {"label": "QUANTITY", "children": [{"label": str(self.quantity)}]},
                {"label": "LOCATION", "children": [{"label": self.warehouse_id}]},
            ]
        }

    def to_tree(self) -> dict:
        return {
            "name": "ADD",
            "children": [
                {"name": "ITEM", "children": [{"name": self.item_id}]},
                {"name": "QUANTITY", "children": [{"name": str(self.quantity)}]},
                {"name": "LOCATION", "children": [{"name": self.warehouse_id}]},
            ]
        }


@dataclass
class RemoveCommandNode(ASTNode):
    """REMOVE ITEM <item_id> QUANTITY <n> LOCATION <warehouse_id>"""
    item_id: str
    quantity: int
    warehouse_id: str
    node_type: str = "REMOVE_COMMAND"

    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "operation": CommandType.REMOVE.value,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "warehouse_id": self.warehouse_id,
            "children": [
                {"label": "ITEM", "children": [{"label": self.item_id}]},
                {"label": "QUANTITY", "children": [{"label": str(self.quantity)}]},
                {"label": "LOCATION", "children": [{"label": self.warehouse_id}]},
            ]
        }

    def to_tree(self) -> dict:
        return {
            "name": "REMOVE",
            "children": [
                {"name": "ITEM", "children": [{"name": self.item_id}]},
                {"name": "QUANTITY", "children": [{"name": str(self.quantity)}]},
                {"name": "LOCATION", "children": [{"name": self.warehouse_id}]},
            ]
        }


@dataclass
class TransferCommandNode(ASTNode):
    """TRANSFER ITEM <item_id> QUANTITY <n> FROM <src_id> TO <dst_id>"""
    item_id: str
    quantity: int
    source_warehouse_id: str
    destination_warehouse_id: str
    node_type: str = "TRANSFER_COMMAND"

    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "operation": CommandType.TRANSFER.value,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "source_warehouse_id": self.source_warehouse_id,
            "destination_warehouse_id": self.destination_warehouse_id,
            "children": [
                {"label": "ITEM", "children": [{"label": self.item_id}]},
                {"label": "QUANTITY", "children": [{"label": str(self.quantity)}]},
                {"label": "FROM", "children": [{"label": self.source_warehouse_id,
                    "children": [{"label": "TO", "children": [{"label": self.destination_warehouse_id}]}]}]},
            ]
        }

    def to_tree(self) -> dict:
        return {
            "name": "TRANSFER",
            "children": [
                {"name": "ITEM", "children": [{"name": self.item_id}]},
                {"name": "QUANTITY", "children": [{"name": str(self.quantity)}]},
                {"name": "FROM", "children": [{"name": self.source_warehouse_id,
                    "children": [{"name": "TO", "children": [{"name": self.destination_warehouse_id}]}]}]},
            ]
        }


@dataclass
class CheckCommandNode(ASTNode):
    """CHECK ITEM <item_id> LOCATION <warehouse_id>"""
    item_id: str
    warehouse_id: str
    node_type: str = "CHECK_COMMAND"

    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "operation": CommandType.CHECK.value,
            "item_id": self.item_id,
            "warehouse_id": self.warehouse_id,
            "children": [
                {"label": "ITEM", "children": [{"label": self.item_id}]},
                {"label": "LOCATION", "children": [{"label": self.warehouse_id}]},
            ]
        }

    def to_tree(self) -> dict:
        return {
            "name": "CHECK",
            "children": [
                {"name": "ITEM", "children": [{"name": self.item_id}]},
                {"name": "LOCATION", "children": [{"name": self.warehouse_id}]},
            ]
        }


@dataclass
class UpdateCommandNode(ASTNode):
    """UPDATE ITEM <item_id> QUANTITY <n> LOCATION <warehouse_id>"""
    item_id: str
    quantity: int
    warehouse_id: str
    node_type: str = "UPDATE_COMMAND"

    def to_dict(self) -> dict:
        return {
            "node_type": self.node_type,
            "operation": CommandType.UPDATE.value,
            "item_id": self.item_id,
            "quantity": self.quantity,
            "warehouse_id": self.warehouse_id,
            "children": [
                {"label": "ITEM", "children": [{"label": self.item_id}]},
                {"label": "QUANTITY", "children": [{"label": str(self.quantity)}]},
                {"label": "LOCATION", "children": [{"label": self.warehouse_id}]},
            ]
        }

    def to_tree(self) -> dict:
        return {
            "name": "UPDATE",
            "children": [
                {"name": "ITEM", "children": [{"name": self.item_id}]},
                {"name": "QUANTITY", "children": [{"name": str(self.quantity)}]},
                {"name": "LOCATION", "children": [{"name": self.warehouse_id}]},
            ]
        }
