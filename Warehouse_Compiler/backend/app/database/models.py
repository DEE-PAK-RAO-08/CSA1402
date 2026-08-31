"""SQLAlchemy ORM models for all 8 database tables."""
import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Enum as SAEnum, func
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum("admin", "operator", "viewer", name="user_roles"), nullable=False, default="viewer")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="users")
    commands = relationship("Command", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=True)
    capacity = Column(Integer, nullable=False, default=10000)
    status = Column(SAEnum("active", "inactive", name="warehouse_status"), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="warehouse")
    inventory = relationship("Inventory", back_populates="warehouse")
    source_transactions = relationship("Transaction", foreign_keys="Transaction.source_warehouse_id",
                                       back_populates="source_warehouse")
    dest_transactions = relationship("Transaction", foreign_keys="Transaction.destination_warehouse_id",
                                     back_populates="destination_warehouse")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, nullable=False, index=True)
    item_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    unit = Column(String(20), nullable=True, default="units")
    status = Column(SAEnum("active", "inactive", name="item_status"), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inventory = relationship("Inventory", back_populates="item")
    transactions = relationship("Transaction", back_populates="item")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    item = relationship("Item", back_populates="inventory")
    warehouse = relationship("Warehouse", back_populates="inventory")


class Command(Base):
    __tablename__ = "commands"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raw_command = Column(Text, nullable=False)
    command_type = Column(String(20), nullable=True)
    lexical_status = Column(String(20), default="pending")
    syntax_status = Column(String(20), default="pending")
    ast_status = Column(String(20), default="pending")
    semantic_status = Column(String(20), default="pending")
    ir_status = Column(String(20), default="pending")
    optimizer_status = Column(String(20), default="pending")
    dag_status = Column(String(20), default="pending")
    execution_status = Column(String(20), default="pending")
    overall_status = Column(String(20), default="pending")

    perf_lex_ms = Column(Integer, nullable=True)
    perf_parse_ms = Column(Integer, nullable=True)
    perf_semantic_ms = Column(Integer, nullable=True)
    perf_ir_ms = Column(Integer, nullable=True)
    perf_opt_ms = Column(Integer, nullable=True)
    perf_dag_ms = Column(Integer, nullable=True)
    perf_exec_ms = Column(Integer, nullable=True)
    perf_total_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="commands")
    tokens = relationship("TokenRecord", back_populates="command")
    transactions = relationship("Transaction", back_populates="command")
    errors = relationship("ErrorRecord", back_populates="command")
    ir_records = relationship("IRRecord", back_populates="command")
    execution_traces = relationship("ExecutionTrace", back_populates="command")


class IRRecord(Base):
    __tablename__ = "ir_records"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    opcode = Column(String(50), nullable=False)
    operand1 = Column(String(100), nullable=True)
    operand2 = Column(String(100), nullable=True)
    operand3 = Column(String(100), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    command = relationship("Command", back_populates="ir_records")


class ExecutionTrace(Base):
    __tablename__ = "execution_traces"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    stage = Column(String(30), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="success")  # success, error, skipped
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    command = relationship("Command", back_populates="execution_traces")



class TokenRecord(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"), nullable=False)
    lexeme = Column(String(100), nullable=False)
    token_type = Column(String(50), nullable=False)
    position = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    command = relationship("Command", back_populates="tokens")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    transaction_type = Column(SAEnum("ADD", "REMOVE", "TRANSFER", "CHECK", "UPDATE",
                                     name="transaction_types"), nullable=False)
    status = Column(SAEnum("completed", "failed", "rolled_back", name="transaction_status"),
                    default="completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    command = relationship("Command", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    item = relationship("Item", back_populates="transactions")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id],
                                    back_populates="source_transactions")
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id],
                                         back_populates="dest_transactions")


class ErrorRecord(Base):
    __tablename__ = "errors"

    id = Column(Integer, primary_key=True, index=True)
    command_id = Column(Integer, ForeignKey("commands.id"), nullable=True)
    error_stage = Column(String(30), nullable=False)
    error_code = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    position = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    command = relationship("Command", back_populates="errors")
