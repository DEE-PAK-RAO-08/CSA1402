"""Items, Warehouses, Transactions, Reports, Users API routes."""
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database.database import get_db
from ..database import models
from ..schemas.schemas import (
    ItemCreate, ItemUpdate, ItemOut,
    WarehouseCreate, WarehouseUpdate, WarehouseOut,
    UserCreate, UserUpdate, UserOut, ReportSummary,
)
from ..services.auth_service import hash_password
from .deps import get_current_user, require_admin

# ── Items ─────────────────────────────────────────────────────────────────────

items_router = APIRouter(prefix="/items", tags=["Items"])

@items_router.get("/")
def list_items(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Item).all()

@items_router.post("/")
def create_item(data: ItemCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(require_admin)):
    existing = db.query(models.Item).filter(models.Item.item_code == data.item_code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists")
    item = models.Item(item_code=data.item_code.upper(), item_name=data.item_name,
                       category=data.category, unit=data.unit)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@items_router.put("/{item_id}")
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(require_admin)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if data.item_name: item.item_name = data.item_name
    if data.category: item.category = data.category
    if data.unit: item.unit = data.unit
    if data.status: item.status = data.status
    db.commit()
    db.refresh(item)
    return item

@items_router.delete("/{item_id}")
def deactivate_item(item_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(require_admin)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.status = "inactive"
    db.commit()
    return {"message": "Item deactivated"}


# ── Warehouses ────────────────────────────────────────────────────────────────

warehouses_router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@warehouses_router.get("/")
def list_warehouses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    warehouses = db.query(models.Warehouse).all()
    result = []
    for wh in warehouses:
        total_stock = db.query(func.sum(models.Inventory.quantity)).filter(
            models.Inventory.warehouse_id == wh.id).scalar() or 0
        item_count = db.query(models.Inventory).filter(
            models.Inventory.warehouse_id == wh.id, models.Inventory.quantity > 0).count()
        result.append({
            "id": wh.id,
            "warehouse_code": wh.warehouse_code,
            "name": wh.name,
            "location": wh.location,
            "capacity": wh.capacity,
            "status": wh.status,
            "current_stock": total_stock,
            "item_count": item_count,
            "utilization_pct": round((total_stock / wh.capacity * 100) if wh.capacity > 0 else 0, 1),
            "created_at": wh.created_at.isoformat() if wh.created_at else None,
        })
    return result

@warehouses_router.get("/{warehouse_id}")
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    total_stock = db.query(func.sum(models.Inventory.quantity)).filter(
        models.Inventory.warehouse_id == wh.id).scalar() or 0
    item_count = db.query(models.Inventory).filter(
        models.Inventory.warehouse_id == wh.id, models.Inventory.quantity > 0).count()
    # Recent transactions
    recent_txns = db.query(models.Transaction).filter(
        (models.Transaction.source_warehouse_id == wh.id) |
        (models.Transaction.destination_warehouse_id == wh.id)
    ).order_by(models.Transaction.created_at.desc()).limit(10).all()
    txn_list = []
    for t in recent_txns:
        txn_list.append({
            "id": t.id,
            "type": t.transaction_type,
            "item_code": t.item.item_code if t.item else None,
            "item_name": t.item.item_name if t.item else None,
            "quantity": t.quantity,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    # Inventory breakdown
    inv_rows = db.query(models.Inventory).filter(
        models.Inventory.warehouse_id == wh.id, models.Inventory.quantity > 0
    ).all()
    inv_list = []
    for inv in inv_rows:
        inv_list.append({
            "item_code": inv.item.item_code if inv.item else None,
            "item_name": inv.item.item_name if inv.item else None,
            "quantity": inv.quantity,
        })
    return {
        "id": wh.id,
        "warehouse_code": wh.warehouse_code,
        "name": wh.name,
        "location": wh.location,
        "capacity": wh.capacity,
        "status": wh.status,
        "current_stock": total_stock,
        "item_count": item_count,
        "utilization_pct": round((total_stock / wh.capacity * 100) if wh.capacity > 0 else 0, 1),
        "created_at": wh.created_at.isoformat() if wh.created_at else None,
        "recent_transactions": txn_list,
        "inventory": inv_list,
    }

@warehouses_router.post("/")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(require_admin)):
    existing = db.query(models.Warehouse).filter(
        models.Warehouse.warehouse_code == data.warehouse_code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse code already exists")
    wh = models.Warehouse(warehouse_code=data.warehouse_code.upper(), name=data.name,
                          location=data.location, capacity=data.capacity)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@warehouses_router.put("/{warehouse_id}")
def update_warehouse(warehouse_id: int, data: WarehouseUpdate, db: Session = Depends(get_db),
                     current_user: models.User = Depends(require_admin)):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    if data.name: wh.name = data.name
    if data.location: wh.location = data.location
    if data.capacity: wh.capacity = data.capacity
    if data.status: wh.status = data.status
    db.commit()
    db.refresh(wh)
    return wh


# ── Transactions ──────────────────────────────────────────────────────────────

transactions_router = APIRouter(prefix="/transactions", tags=["Transactions"])

@transactions_router.get("/")
def list_transactions(
    skip: int = 0, limit: int = 100,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Transaction)
    if current_user.role != "admin":
        query = query.filter(models.Transaction.user_id == current_user.id)
    if transaction_type:
        query = query.filter(models.Transaction.transaction_type == transaction_type.upper())
    txns = query.order_by(models.Transaction.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for t in txns:
        result.append({
            "id": t.id,
            "command_id": t.command_id,
            "user_id": t.user_id,
            "username": t.user.username if t.user else None,
            "item_id": t.item_id,
            "item_code": t.item.item_code if t.item else None,
            "item_name": t.item.item_name if t.item else None,
            "source_warehouse_id": t.source_warehouse_id,
            "source_warehouse_code": t.source_warehouse.warehouse_code if t.source_warehouse else None,
            "destination_warehouse_id": t.destination_warehouse_id,
            "destination_warehouse_code": t.destination_warehouse.warehouse_code if t.destination_warehouse else None,
            "quantity": t.quantity,
            "transaction_type": t.transaction_type,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    return result

@transactions_router.get("/{transaction_id}")
def get_transaction(transaction_id: int, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    t = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {
        "id": t.id,
        "command_id": t.command_id,
        "user_id": t.user_id,
        "username": t.user.username if t.user else None,
        "item_code": t.item.item_code if t.item else None,
        "item_name": t.item.item_name if t.item else None,
        "source_warehouse_code": t.source_warehouse.warehouse_code if t.source_warehouse else None,
        "destination_warehouse_code": t.destination_warehouse.warehouse_code if t.destination_warehouse else None,
        "quantity": t.quantity,
        "transaction_type": t.transaction_type,
        "status": t.status,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


# ── Reports ───────────────────────────────────────────────────────────────────

reports_router = APIRouter(prefix="/reports", tags=["Reports"])

@reports_router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_commands = db.query(models.Command).count()
    successful = db.query(models.Command).filter(models.Command.overall_status.in_(["completed", "validated"])).count()
    lex_errors = db.query(models.Command).filter(models.Command.overall_status == "lexical_error").count()
    syn_errors = db.query(models.Command).filter(models.Command.overall_status == "syntax_error").count()
    sem_errors = db.query(models.Command).filter(models.Command.overall_status == "semantic_error").count()
    exe_failures = db.query(models.Command).filter(models.Command.overall_status == "execution_error").count()
    failed = lex_errors + syn_errors + sem_errors + exe_failures
    total_inv = db.query(models.Inventory).count()
    total_items = db.query(models.Item).filter(models.Item.status == "active").count()
    total_wh = db.query(models.Warehouse).filter(models.Warehouse.status == "active").count()
    total_txn = db.query(models.Transaction).count()

    return {
        "total_commands": total_commands,
        "successful_commands": successful,
        "failed_commands": failed,
        "lexical_errors": lex_errors,
        "syntax_errors": syn_errors,
        "semantic_errors": sem_errors,
        "execution_failures": exe_failures,
        "total_inventory_items": total_inv,
        "total_items": total_items,
        "total_warehouses": total_wh,
        "total_transactions": total_txn,
    }

@reports_router.get("/inventory")
def inventory_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    warehouses = db.query(models.Warehouse).filter(models.Warehouse.status == "active").all()
    result = []
    for wh in warehouses:
        total = db.query(func.sum(models.Inventory.quantity)).filter(
            models.Inventory.warehouse_id == wh.id).scalar() or 0
        result.append({
            "warehouse_code": wh.warehouse_code,
            "warehouse_name": wh.name,
            "total_stock": total,
            "capacity": wh.capacity,
            "utilization_pct": round((total / wh.capacity * 100) if wh.capacity > 0 else 0, 1),
        })
    return result

@reports_router.get("/transactions")
def transaction_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    types = ["ADD", "REMOVE", "TRANSFER", "CHECK", "UPDATE"]
    result = []
    for t in types:
        count = db.query(models.Transaction).filter(models.Transaction.transaction_type == t).count()
        result.append({"type": t, "count": count})
    return result

@reports_router.get("/errors")
def error_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stages = ["LEXICAL", "SYNTAX", "SEMANTIC", "EXECUTION"]
    result = []
    for s in stages:
        count = db.query(models.ErrorRecord).filter(models.ErrorRecord.error_stage == s).count()
        result.append({"stage": s, "count": count})
    return result

@reports_router.get("/daily")
def daily_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = datetime.date.today()
    # Initialize past 7 days with actual zero counts
    by_date = {
        (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"): {
            "date": (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d"),
            "total": 0,
            "successful": 0,
            "failed": 0
        }
        for i in range(6, -1, -1)
    }

    commands = db.query(models.Command).order_by(models.Command.created_at.asc()).all()
    for cmd in commands:
        if cmd.created_at:
            d_str = cmd.created_at.strftime("%Y-%m-%d")
        else:
            d_str = today.strftime("%Y-%m-%d")
        
        if d_str not in by_date:
            by_date[d_str] = {"date": d_str, "total": 0, "successful": 0, "failed": 0}
        
        by_date[d_str]["total"] += 1
        if cmd.overall_status in ["completed", "validated"]:
            by_date[d_str]["successful"] += 1
        else:
            by_date[d_str]["failed"] += 1

    return list(by_date.values())



# ── Users ─────────────────────────────────────────────────────────────────────

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/")
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": u.role,
             "warehouse_id": u.warehouse_id,
             "warehouse_code": u.warehouse.warehouse_code if u.warehouse else None,
             "is_active": u.is_active,
             "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]

@users_router.post("/")
def create_user(data: UserCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(require_admin)):
    existing = db.query(models.User).filter(models.User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = models.User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
        warehouse_id=data.warehouse_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}

@users_router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db),
                current_user: models.User = Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role: user.role = data.role
    if data.warehouse_id is not None: user.warehouse_id = data.warehouse_id
    if data.is_active is not None: user.is_active = data.is_active
    db.commit()
    return {"message": "User updated"}
