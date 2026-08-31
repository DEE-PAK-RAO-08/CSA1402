"""
WICL Error Handler
==================
Centralised, structured error system for all compiler stages.

Error Codes:
  LEX001 — Invalid token
  LEX002 — Empty command

  SYN001 — Missing keyword (expected X got Y)
  SYN002 — Expected NUMBER got non-number
  SYN003 — Unexpected extra tokens after valid command
  SYN004 — Unknown command verb

  SEM001 — Item does not exist
  SEM002 — Warehouse does not exist
  SEM003 — Quantity must be positive
  SEM004 — Insufficient stock
  SEM005 — Source and destination warehouse identical
  SEM006 — Destination warehouse capacity exceeded
  SEM007 — Item not in source warehouse
  SEM008 — User not authorized for warehouse
  SEM009 — Item not storable at warehouse

  AUTH001 — Authentication failed
  AUTH002 — Insufficient permissions

  EXE001 — Execution engine error
  DB001  — Database transaction error
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import datetime


class ErrorStage(str, Enum):
    LEXICAL = "LEXICAL"
    SYNTAX = "SYNTAX"
    SEMANTIC = "SEMANTIC"
    AUTHORIZATION = "AUTHORIZATION"
    EXECUTION = "EXECUTION"
    DATABASE = "DATABASE"


class ErrorCode(str, Enum):
    # Lexical
    LEX001 = "LEX001"
    LEX002 = "LEX002"
    # Syntax
    SYN001 = "SYN001"
    SYN002 = "SYN002"
    SYN003 = "SYN003"
    SYN004 = "SYN004"
    # Semantic
    SEM001 = "SEM001"
    SEM002 = "SEM002"
    SEM003 = "SEM003"
    SEM004 = "SEM004"
    SEM005 = "SEM005"
    SEM006 = "SEM006"
    SEM007 = "SEM007"
    SEM008 = "SEM008"
    SEM009 = "SEM009"
    # Auth
    AUTH001 = "AUTH001"
    AUTH002 = "AUTH002"
    # Execution
    EXE001 = "EXE001"
    DB001 = "DB001"


# Human-readable descriptions for each error code
ERROR_DESCRIPTIONS = {
    ErrorCode.LEX001: "Invalid token encountered",
    ErrorCode.LEX002: "Command cannot be empty",
    ErrorCode.SYN001: "Unexpected token — grammar rule violated",
    ErrorCode.SYN002: "Expected a numeric quantity",
    ErrorCode.SYN003: "Unexpected extra tokens after command",
    ErrorCode.SYN004: "Unknown command verb",
    ErrorCode.SEM001: "Item does not exist in the system",
    ErrorCode.SEM002: "Warehouse does not exist in the system",
    ErrorCode.SEM003: "Quantity must be greater than zero",
    ErrorCode.SEM004: "Insufficient stock for the requested quantity",
    ErrorCode.SEM005: "Source and destination warehouses cannot be identical",
    ErrorCode.SEM006: "Destination warehouse capacity would be exceeded",
    ErrorCode.SEM007: "Item not found in the source warehouse",
    ErrorCode.SEM008: "User not authorized to operate on this warehouse",
    ErrorCode.SEM009: "Item cannot be stored at this warehouse",
    ErrorCode.AUTH001: "Authentication failed",
    ErrorCode.AUTH002: "Insufficient permissions for this operation",
    ErrorCode.EXE001: "Execution engine encountered an error",
    ErrorCode.DB001: "Database transaction failed",
}


@dataclass
class CompilerError:
    stage: ErrorStage
    error_code: ErrorCode
    message: str
    position: Optional[int] = None
    suggestion: Optional[str] = None
    raw_input: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

    @property
    def description(self) -> str:
        return ERROR_DESCRIPTIONS.get(self.error_code, self.message)

    def to_dict(self) -> dict:
        return {
            "stage": self.stage.value,
            "error_code": self.error_code.value,
            "description": self.description,
            "message": self.message,
            "position": self.position,
            "suggestion": self.suggestion,
            "raw_input": self.raw_input,
            "timestamp": self.timestamp,
        }
