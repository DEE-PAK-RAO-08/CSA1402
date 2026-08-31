"""Inventory API routes."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.database import get_db
from ..database import models
from .deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def _stock_status(qty: int, capacity: int) -> str:
    if qty == 0:
        return "out_of_stock"
    pct = (qty / capacity * 100) if capacity > 0 else 0
    if pct > 100:
        return "over_capacity"
    if pct < 15:
        return "low_stock"
    return "in_stock"


@router.get("/")
def list_inventory(
    warehouse_code: Optional[str] = None,
    item_code: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Inventory)
    if warehouse_code:
        wh = db.query(models.Warehouse).filter(models.Warehouse.warehouse_code == warehouse_code.upper()).first()
        if wh:
            query = query.filter(models.Inventory.warehouse_id == wh.id)
    if item_code:
        item = db.query(models.Item).filter(models.Item.item_code == item_code.upper()).first()
        if item:
            query = query.filter(models.Inventory.item_id == item.id)

    inv_list = query.offset(skip).limit(limit).all()
    result = []
    for inv in inv_list:
        result.append({
            "id": inv.id,
            "item_id": inv.item_id,
            "warehouse_id": inv.warehouse_id,
            "quantity": inv.quantity,
            "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
            "item_code": inv.item.item_code if inv.item else None,
            "item_name": inv.item.item_name if inv.item else None,
            "item_category": inv.item.category if inv.item else None,
            "warehouse_code": inv.warehouse.warehouse_code if inv.warehouse else None,
            "warehouse_name": inv.warehouse.name if inv.warehouse else None,
            "warehouse_capacity": inv.warehouse.capacity if inv.warehouse else None,
            "stock_status": _stock_status(inv.quantity, inv.warehouse.capacity if inv.warehouse else 10000),
        })
    return result


@router.get("/{inventory_id}")
def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inv = db.query(models.Inventory).filter(models.Inventory.id == inventory_id).first()
    if not inv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return {
        "id": inv.id,
        "item_code": inv.item.item_code,
        "item_name": inv.item.item_name,
        "warehouse_code": inv.warehouse.warehouse_code,
        "warehouse_name": inv.warehouse.name,
        "quantity": inv.quantity,
        "warehouse_capacity": inv.warehouse.capacity,
        "stock_status": _stock_status(inv.quantity, inv.warehouse.capacity),
        "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
    }
