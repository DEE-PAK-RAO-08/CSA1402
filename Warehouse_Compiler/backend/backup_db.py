"""
WICL Database Backup Utility
============================
Creates a timestamped copy of the production SQLite database.
"""
import os
import shutil
import datetime

def backup():
    db_path = os.path.join(os.path.dirname(__file__), "warehouse.db")
    if not os.path.exists(db_path):
        print(f"Database file not found at: {db_path}")
        return

    backup_dir = os.path.join(os.path.dirname(__file__), "backups")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"warehouse_backup_{timestamp}.db")

    shutil.copy2(db_path, backup_path)
    print(f"✅ Backup created successfully: {backup_path}")

if __name__ == "__main__":
    backup()
