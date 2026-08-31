"""
Seed script — creates realistic demo data for WICL platform.
Run: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal, init_db
from app.database import models
from app.services.auth_service import hash_password
import datetime


def seed():
    init_db()
    db = SessionLocal()

    try:
        # ── Warehouses ────────────────────────────────────────────────────
        warehouses_data = [
            {"code": "WH01", "name": "Chennai Central Warehouse", "location": "Chennai, Tamil Nadu", "capacity": 5000},
            {"code": "WH02", "name": "Bangalore Distribution Center", "location": "Bangalore, Karnataka", "capacity": 8000},
            {"code": "WH03", "name": "Hyderabad Storage Facility", "location": "Hyderabad, Telangana", "capacity": 6000},
            {"code": "WH04", "name": "Coimbatore Warehouse", "location": "Coimbatore, Tamil Nadu", "capacity": 4000},
        ]

        wh_map = {}
        for wd in warehouses_data:
            existing = db.query(models.Warehouse).filter(models.Warehouse.warehouse_code == wd["code"]).first()
            if not existing:
                wh = models.Warehouse(
                    warehouse_code=wd["code"], name=wd["name"],
                    location=wd["location"], capacity=wd["capacity"]
                )
                db.add(wh)
                db.flush()
                wh_map[wd["code"]] = wh.id
            else:
                wh_map[wd["code"]] = existing.id

        db.commit()

        # Refresh map
        for code in ["WH01", "WH02", "WH03", "WH04"]:
            wh = db.query(models.Warehouse).filter(models.Warehouse.warehouse_code == code).first()
            if wh:
                wh_map[code] = wh.id

        # ── Items ─────────────────────────────────────────────────────────
        items_data = [
            {"code": "LAPTOP001", "name": "Dell Latitude Laptop", "category": "Electronics"},
            {"code": "MOUSE001", "name": "Logitech Wireless Mouse", "category": "Peripherals"},
            {"code": "KEYBOARD001", "name": "Mechanical Keyboard", "category": "Peripherals"},
            {"code": "MONITOR001", "name": "27-inch LED Monitor", "category": "Display"},
            {"code": "PRINTER001", "name": "HP LaserJet Printer", "category": "Office Equipment"},
            {"code": "SCANNER001", "name": "Document Scanner A4", "category": "Office Equipment"},
            {"code": "TABLET001", "name": "iPad Pro 12.9", "category": "Electronics"},
            {"code": "HEADSET001", "name": "Noise-Cancelling Headset", "category": "Audio"},
        ]

        item_map = {}
        for it in items_data:
            existing = db.query(models.Item).filter(models.Item.item_code == it["code"]).first()
            if not existing:
                item = models.Item(item_code=it["code"], item_name=it["name"], category=it["category"])
                db.add(item)
                db.flush()
                item_map[it["code"]] = item.id
            else:
                item_map[it["code"]] = existing.id

        db.commit()

        for code in [i["code"] for i in items_data]:
            item = db.query(models.Item).filter(models.Item.item_code == code).first()
            if item:
                item_map[code] = item.id

        # ── Users ─────────────────────────────────────────────────────────
        users_data = [
            {"username": "admin", "password": "admin123", "role": "admin", "warehouse_id": None},
            {"username": "operator1", "password": "op123", "role": "operator", "warehouse_code": "WH01"},
            {"username": "operator2", "password": "op123", "role": "operator", "warehouse_code": "WH02"},
            {"username": "viewer", "password": "view123", "role": "viewer", "warehouse_id": None},
        ]

        for ud in users_data:
            existing = db.query(models.User).filter(models.User.username == ud["username"]).first()
            if not existing:
                wh_id = None
                if "warehouse_code" in ud:
                    wh_id = wh_map.get(ud["warehouse_code"])
                elif "warehouse_id" in ud:
                    wh_id = ud["warehouse_id"]
                user = models.User(
                    username=ud["username"],
                    password_hash=hash_password(ud["password"]),
                    role=ud["role"],
                    warehouse_id=wh_id,
                )
                db.add(user)

        db.commit()

        # Get admin user for seeding commands
        admin = db.query(models.User).filter(models.User.username == "admin").first()

        # ── Inventory ─────────────────────────────────────────────────────
        inventory_data = [
            # WH01 — Chennai
            ("LAPTOP001", "WH01", 120),
            ("MOUSE001", "WH01", 450),
            ("KEYBOARD001", "WH01", 300),
            ("MONITOR001", "WH01", 80),
            ("PRINTER001", "WH01", 25),
            # WH02 — Bangalore
            ("LAPTOP001", "WH02", 200),
            ("MOUSE001", "WH02", 600),
            ("KEYBOARD001", "WH02", 500),
            ("SCANNER001", "WH02", 40),
            ("TABLET001", "WH02", 90),
            # WH03 — Hyderabad
            ("MONITOR001", "WH03", 150),
            ("PRINTER001", "WH03", 60),
            ("SCANNER001", "WH03", 80),
            ("HEADSET001", "WH03", 200),
            # WH04 — Coimbatore
            ("KEYBOARD001", "WH04", 180),
            ("MOUSE001", "WH04", 320),
            ("HEADSET001", "WH04", 100),
        ]

        for item_code, wh_code, qty in inventory_data:
            i_id = item_map.get(item_code)
            w_id = wh_map.get(wh_code)
            if i_id and w_id:
                existing = db.query(models.Inventory).filter(
                    models.Inventory.item_id == i_id,
                    models.Inventory.warehouse_id == w_id
                ).first()
                if not existing:
                    db.add(models.Inventory(item_id=i_id, warehouse_id=w_id, quantity=qty))

        db.commit()

        # ── Seed Initial Commands ──────────────────────────────────────────
        from app.services.command_service import CommandService
        cmd_service = CommandService()
        sample_commands = [
            ("ADD 50 LAPTOP001 TO WH01;", True),
            ("TRANSFER 20 MOUSE001 FROM WH01 TO WH02;", True),
            ("CHECK MONITOR001 IN WH03;", True),
            ("REMOVE 5 KEYBOARD001 FROM WH04;", True),
            ("INVALID_KEYWORD 100 ITEM;", False),
            ("ADD LAPTOP001 TO WH01;", False),
            ("REMOVE 99999 LAPTOP001 FROM WH01;", False),
        ]
        
        for raw_cmd, exec_flag in sample_commands:
            try:
                cmd_service.analyze(raw_command=raw_cmd, user=admin, db=db, execute=exec_flag)
            except Exception:
                pass

        print("[OK] Seed data created successfully!")
        print("\nDemo Users:")
        print("  admin      / admin123  - Full access")
        print("  operator1  / op123     - WH01 operator")
        print("  operator2  / op123     - WH02 operator")
        print("  viewer     / view123   - Read-only")
        print("\nWarehouses: WH01, WH02, WH03, WH04")
        print("Items: LAPTOP001, MOUSE001, KEYBOARD001, MONITOR001, PRINTER001, SCANNER001, TABLET001, HEADSET001")

    except Exception as e:
        db.rollback()
        print(f"[FAIL] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
