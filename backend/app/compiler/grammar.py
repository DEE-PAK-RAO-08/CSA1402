"""
WICL Grammar Definition
========================
Formal grammar rules for the WICL language.

Grammar (BNF-style):

COMMAND         → ADD_COMMAND
                | REMOVE_COMMAND
                | TRANSFER_COMMAND
                | CHECK_COMMAND
                | UPDATE_COMMAND

ADD_COMMAND     → ADD ITEM IDENTIFIER QUANTITY NUMBER LOCATION IDENTIFIER

REMOVE_COMMAND  → REMOVE ITEM IDENTIFIER QUANTITY NUMBER LOCATION IDENTIFIER

TRANSFER_COMMAND → TRANSFER ITEM IDENTIFIER QUANTITY NUMBER FROM IDENTIFIER TO IDENTIFIER

CHECK_COMMAND   → CHECK ITEM IDENTIFIER LOCATION IDENTIFIER

UPDATE_COMMAND  → UPDATE ITEM IDENTIFIER QUANTITY NUMBER LOCATION IDENTIFIER

IDENTIFIER      → [A-Z][A-Z0-9]*
NUMBER          → -?[0-9]+
"""
from .tokens import TokenType

# Grammar rules as ordered sequences of expected token types.
# Used by the parser for error reporting and validation.
GRAMMAR_RULES = {
    "ADD_COMMAND": [
        TokenType.ADD,
        TokenType.ITEM,
        TokenType.IDENTIFIER,   # item_id
        TokenType.QUANTITY,
        TokenType.NUMBER,       # quantity
        TokenType.LOCATION,
        TokenType.IDENTIFIER,   # warehouse_id
    ],
    "REMOVE_COMMAND": [
        TokenType.REMOVE,
        TokenType.ITEM,
        TokenType.IDENTIFIER,
        TokenType.QUANTITY,
        TokenType.NUMBER,
        TokenType.LOCATION,
        TokenType.IDENTIFIER,
    ],
    "TRANSFER_COMMAND": [
        TokenType.TRANSFER,
        TokenType.ITEM,
        TokenType.IDENTIFIER,
        TokenType.QUANTITY,
        TokenType.NUMBER,
        TokenType.FROM,
        TokenType.IDENTIFIER,   # source
        TokenType.TO,
        TokenType.IDENTIFIER,   # destination
    ],
    "CHECK_COMMAND": [
        TokenType.CHECK,
        TokenType.ITEM,
        TokenType.IDENTIFIER,
        TokenType.LOCATION,
        TokenType.IDENTIFIER,
    ],
    "UPDATE_COMMAND": [
        TokenType.UPDATE,
        TokenType.ITEM,
        TokenType.IDENTIFIER,
        TokenType.QUANTITY,
        TokenType.NUMBER,
        TokenType.LOCATION,
        TokenType.IDENTIFIER,
    ],
}

# Map command keyword to its grammar rule name
COMMAND_RULE_MAP = {
    TokenType.ADD: "ADD_COMMAND",
    TokenType.REMOVE: "REMOVE_COMMAND",
    TokenType.TRANSFER: "TRANSFER_COMMAND",
    TokenType.CHECK: "CHECK_COMMAND",
    TokenType.UPDATE: "UPDATE_COMMAND",
}

# Human-readable labels for each position in each rule (for error messages)
RULE_POSITION_LABELS = {
    "ADD_COMMAND": {
        0: "ADD keyword",
        1: "ITEM keyword",
        2: "item identifier (e.g. LAPTOP001)",
        3: "QUANTITY keyword",
        4: "numeric quantity (e.g. 50)",
        5: "LOCATION keyword",
        6: "warehouse identifier (e.g. WH01)",
    },
    "REMOVE_COMMAND": {
        0: "REMOVE keyword",
        1: "ITEM keyword",
        2: "item identifier (e.g. LAPTOP001)",
        3: "QUANTITY keyword",
        4: "numeric quantity (e.g. 10)",
        5: "LOCATION keyword",
        6: "warehouse identifier (e.g. WH01)",
    },
    "TRANSFER_COMMAND": {
        0: "TRANSFER keyword",
        1: "ITEM keyword",
        2: "item identifier (e.g. LAPTOP001)",
        3: "QUANTITY keyword",
        4: "numeric quantity (e.g. 20)",
        5: "FROM keyword",
        6: "source warehouse identifier (e.g. WH01)",
        7: "TO keyword",
        8: "destination warehouse identifier (e.g. WH02)",
    },
    "CHECK_COMMAND": {
        0: "CHECK keyword",
        1: "ITEM keyword",
        2: "item identifier (e.g. LAPTOP001)",
        3: "LOCATION keyword",
        4: "warehouse identifier (e.g. WH01)",
    },
    "UPDATE_COMMAND": {
        0: "UPDATE keyword",
        1: "ITEM keyword",
        2: "item identifier (e.g. LAPTOP001)",
        3: "QUANTITY keyword",
        4: "numeric quantity (e.g. 100)",
        5: "LOCATION keyword",
        6: "warehouse identifier (e.g. WH01)",
    },
}

# Suggested corrections for common mistakes
CORRECTION_TEMPLATES = {
    "ADD_COMMAND": "ADD ITEM <ITEM_ID> QUANTITY <NUMBER> LOCATION <WAREHOUSE_ID>",
    "REMOVE_COMMAND": "REMOVE ITEM <ITEM_ID> QUANTITY <NUMBER> LOCATION <WAREHOUSE_ID>",
    "TRANSFER_COMMAND": "TRANSFER ITEM <ITEM_ID> QUANTITY <NUMBER> FROM <SRC_WAREHOUSE> TO <DST_WAREHOUSE>",
    "CHECK_COMMAND": "CHECK ITEM <ITEM_ID> LOCATION <WAREHOUSE_ID>",
    "UPDATE_COMMAND": "UPDATE ITEM <ITEM_ID> QUANTITY <NUMBER> LOCATION <WAREHOUSE_ID>",
}
