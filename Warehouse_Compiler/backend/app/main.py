"""
FastAPI main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database.database import init_db
from .api.auth import router as auth_router
from .api.commands import router as commands_router
from .api.inventory import router as inventory_router
from .api.routes import (
    items_router, warehouses_router, transactions_router,
    reports_router, users_router,
)

app = FastAPI(
    title="WICL — Warehouse Inventory Command Language Platform",
    description="Compiler-Based Semantic Analysis for Logistics Warehouse Inventory Management",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(commands_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(items_router, prefix="/api")
app.include_router(warehouses_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "message": "WICL Warehouse Command Platform API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
