"""Pydantic schemas for all API request/response models."""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: str = "viewer"  # public signups default to viewer; admin can upgrade

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    warehouse_id: Optional[int] = None
    is_active: int = 1
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "viewer"
    warehouse_id: Optional[int] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    warehouse_id: Optional[int] = None
    is_active: Optional[int] = None


# ── Warehouse ─────────────────────────────────────────────────────────────────

class WarehouseCreate(BaseModel):
    warehouse_code: str
    name: str
    location: Optional[str] = None
    capacity: int = 10000

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

class WarehouseOut(BaseModel):
    id: int
    warehouse_code: str
    name: str
    location: Optional[str] = None
    capacity: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Item ──────────────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    item_code: str
    item_name: str
    category: Optional[str] = None
    unit: Optional[str] = "units"

class ItemUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[str] = None

class ItemOut(BaseModel):
    id: int
    item_code: str
    item_name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Inventory ─────────────────────────────────────────────────────────────────

class InventoryOut(BaseModel):
    id: int
    item_id: int
    warehouse_id: int
    quantity: int
    updated_at: Optional[datetime] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    warehouse_code: Optional[str] = None
    warehouse_name: Optional[str] = None
    warehouse_capacity: Optional[int] = None
    stock_status: Optional[str] = None

    class Config:
        from_attributes = True


# ── Commands ──────────────────────────────────────────────────────────────────

class CommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=500)
    execute: bool = False

class CommandOut(BaseModel):
    id: int
    user_id: int
    raw_command: str
    command_type: Optional[str] = None
    lexical_status: Optional[str] = None
    syntax_status: Optional[str] = None
    ast_status: Optional[str] = None
    semantic_status: Optional[str] = None
    execution_status: Optional[str] = None
    overall_status: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


# ── Transactions ──────────────────────────────────────────────────────────────

class TransactionOut(BaseModel):
    id: int
    command_id: Optional[int] = None
    user_id: int
    item_id: Optional[int] = None
    source_warehouse_id: Optional[int] = None
    destination_warehouse_id: Optional[int] = None
    quantity: int
    transaction_type: str
    status: str
    created_at: Optional[datetime] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    source_warehouse_code: Optional[str] = None
    destination_warehouse_code: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


# ── Reports ───────────────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    total_commands: int
    successful_commands: int
    failed_commands: int
    lexical_errors: int
    syntax_errors: int
    semantic_errors: int
    execution_failures: int
    total_inventory_items: int
    total_items: int
    total_warehouses: int
    total_transactions: int
