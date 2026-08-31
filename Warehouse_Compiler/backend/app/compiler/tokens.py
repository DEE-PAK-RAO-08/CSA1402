"""
WICL Token Definitions
======================
Defines all token types for the Warehouse Inventory Command Language.
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional


class TokenType(str, Enum):
    # ── Keywords ──────────────────────────────────────────────────────────────
    ADD = "ADD"
    REMOVE = "REMOVE"
    TRANSFER = "TRANSFER"
    CHECK = "CHECK"
    UPDATE = "UPDATE"
    MOVE = "MOVE"
    CONFIRM = "CONFIRM"
    DELIVERY = "DELIVERY"
    ITEM = "ITEM"
    QUANTITY = "QUANTITY"
    LOCATION = "LOCATION"
    FROM = "FROM"
    TO = "TO"
    AND = "AND"
    THEN = "THEN"
    IN = "IN"

    # ── Literals ──────────────────────────────────────────────────────────────
    IDENTIFIER = "IDENTIFIER"   # e.g. LAPTOP001, WH01
    NUMBER = "NUMBER"           # e.g. 50, 20

    # ── Special ───────────────────────────────────────────────────────────────
    EOF = "EOF"
    INVALID = "INVALID"


# Set of reserved keywords — used by the lexer
KEYWORDS: dict[str, TokenType] = {
    "ADD": TokenType.ADD,
    "REMOVE": TokenType.REMOVE,
    "TRANSFER": TokenType.TRANSFER,
    "CHECK": TokenType.CHECK,
    "UPDATE": TokenType.UPDATE,
    "MOVE": TokenType.MOVE,
    "CONFIRM": TokenType.CONFIRM,
    "DELIVERY": TokenType.DELIVERY,
    "ITEM": TokenType.ITEM,
    "QUANTITY": TokenType.QUANTITY,
    "LOCATION": TokenType.LOCATION,
    "FROM": TokenType.FROM,
    "TO": TokenType.TO,
    "AND": TokenType.AND,
    "THEN": TokenType.THEN,
    "IN": TokenType.IN,
}

# Commands that are the root of each grammar rule
COMMAND_KEYWORDS = {TokenType.ADD, TokenType.REMOVE, TokenType.TRANSFER,
                    TokenType.CHECK, TokenType.UPDATE, TokenType.MOVE, TokenType.CONFIRM}


@dataclass
class Token:
    """Represents a single lexical token."""
    type: TokenType
    lexeme: str
    position: int           # 1-indexed word position in input
    char_position: int      # 0-indexed character offset

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "lexeme": self.lexeme,
            "position": self.position,
            "char_position": self.char_position,
        }

    def __repr__(self) -> str:
        return f"Token({self.type.value}, '{self.lexeme}', pos={self.position})"
