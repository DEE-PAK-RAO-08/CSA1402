"""
WICL Lexer
==========
Performs lexical analysis on raw WICL command strings.
Produces a list of Token objects with position tracking.

Rules:
  - Keywords are matched case-insensitively but stored in uppercase
  - Identifiers: alphanumeric, may contain digits (e.g. LAPTOP001, WH01)
  - Numbers: sequences of digits only
  - Whitespace is skipped
  - Any other character sequence is an INVALID token
"""
import re
from typing import List, Tuple
from .tokens import Token, TokenType, KEYWORDS
from .error_handler import CompilerError, ErrorStage, ErrorCode


class LexerResult:
    def __init__(self, tokens: List[Token], errors: List[CompilerError], raw_command: str):
        self.tokens = tokens
        self.errors = errors
        self.raw_command = raw_command
        self.success = len(errors) == 0

    def to_dict(self) -> dict:
        return {
            "status": "success" if self.success else "error",
            "tokens": [t.to_dict() for t in self.tokens],
            "errors": [e.to_dict() for e in self.errors],
            "token_count": len(self.tokens),
        }


class Lexer:
    """
    Character-level lexer for the WICL language.

    Strategy:
      1. Strip and normalise input (uppercase)
      2. Walk through the string character by character
      3. Classify each word-sized chunk as KEYWORD, IDENTIFIER, NUMBER, or INVALID
    """

    # Valid identifier chars: letters and digits only (no underscores, hyphens, etc.)
    _IDENT_RE = re.compile(r'^[A-Z][A-Z0-9]*$')
    _NUM_RE = re.compile(r'^-?\d+$')

    def canonicalize(self, raw_command: str) -> str:
        """Strip trailing punctuation and convert shorthand/natural command variants to canonical WICL BNF grammar."""
        cmd = raw_command.strip().rstrip(';').strip().upper()
        
        # 0. Handle natural language MOVE / TRANSFER + UPDATE + CONFIRM multi-clause commands
        # e.g., MOVE ITEM A123 FROM WAREHOUSE_A TO WAREHOUSE_B AND UPDATE QUANTITY TO 50 THEN CONFIRM DELIVERY
        if ('AND' in cmd or 'THEN' in cmd) and not cmd.startswith('BEGIN BATCH'):
            move_match = re.search(r'(?:MOVE|TRANSFER)\s+(?:ITEM\s+)?([A-Z0-9_]+)\s+FROM\s+([A-Z0-9_]+)\s+TO\s+([A-Z0-9_]+)', cmd)
            update_match = re.search(r'UPDATE\s+(?:QUANTITY\s+)?(?:TO\s+)?(\d+)', cmd)
            if move_match:
                item = move_match.group(1)
                src = move_match.group(2)
                dst = move_match.group(3)
                qty = update_match.group(1) if update_match else "20"
                sub_cmds = [
                    f"TRANSFER ITEM {item} QUANTITY {qty} FROM {src} TO {dst}",
                    f"UPDATE ITEM {item} QUANTITY {qty} LOCATION {dst}",
                    f"CHECK ITEM {item} LOCATION {dst}",
                ]
                return "BEGIN BATCH\n" + "\n".join(sub_cmds) + "\nEND BATCH"

        # 0b. Single MOVE ITEM <item> FROM <src> TO <dst> ==> TRANSFER ITEM <item> QUANTITY 20 FROM <src> TO <dst>
        cmd = re.sub(
            r'^MOVE\s+(?:ITEM\s+)?([A-Z0-9_]+)\s+FROM\s+([A-Z0-9_]+)\s+TO\s+([A-Z0-9_]+)$',
            r'TRANSFER ITEM \1 QUANTITY 20 FROM \2 TO \3',
            cmd
        )

        # 1. ADD <num> <item> TO|LOCATION <wh>  ==> ADD ITEM <item> QUANTITY <num> LOCATION <wh>
        cmd = re.sub(
            r'^ADD\s+(\d+)\s+([A-Z0-9_]+)\s+(?:TO|LOCATION)\s+([A-Z0-9_]+)$',
            r'ADD ITEM \2 QUANTITY \1 LOCATION \3',
            cmd
        )

        # 2. TRANSFER <num> <item> FROM <src> TO <dst> ==> TRANSFER ITEM <item> QUANTITY <num> FROM <src> TO <dst>
        cmd = re.sub(
            r'^TRANSFER\s+(\d+)\s+([A-Z0-9_]+)\s+FROM\s+([A-Z0-9_]+)\s+TO\s+([A-Z0-9_]+)$',
            r'TRANSFER ITEM \2 QUANTITY \1 FROM \3 TO \4',
            cmd
        )

        # 3. REMOVE <num> <item> FROM|LOCATION <wh> ==> REMOVE ITEM <item> QUANTITY <num> LOCATION <wh>
        cmd = re.sub(
            r'^REMOVE\s+(\d+)\s+([A-Z0-9_]+)\s+(?:FROM|LOCATION)\s+([A-Z0-9_]+)$',
            r'REMOVE ITEM \2 QUANTITY \1 LOCATION \3',
            cmd
        )

        # 4. CHECK <item> IN|LOCATION <wh> ==> CHECK ITEM <item> LOCATION <wh>
        cmd = re.sub(
            r'^CHECK\s+(?:ITEM\s+)?([A-Z0-9_]+)\s+(?:IN|LOCATION)\s+([A-Z0-9_]+)$',
            r'CHECK ITEM \1 LOCATION \2',
            cmd
        )

        # 5. UPDATE <num> <item> LOCATION <wh> ==> UPDATE ITEM <item> QUANTITY <num> LOCATION <wh>
        cmd = re.sub(
            r'^UPDATE\s+(\d+)\s+([A-Z0-9_]+)\s+LOCATION\s+([A-Z0-9_]+)$',
            r'UPDATE ITEM \2 QUANTITY \1 LOCATION \3',
            cmd
        )

        return cmd

    def tokenize(self, raw_command: str) -> LexerResult:
        tokens: List[Token] = []
        errors: List[CompilerError] = []

        # Normalise & canonicalize
        normalised = self.canonicalize(raw_command)
        raw_words = normalised.split()
        words = [w.rstrip(';,') for w in raw_words]

        char_offset = 0
        for pos_index, word in enumerate(words, start=1):
            # Track character position in original (normalised) string
            char_pos = normalised.find(word, char_offset)
            char_offset = char_pos + len(word)

            token_type = self._classify(word)

            if token_type == TokenType.INVALID:
                errors.append(CompilerError(
                    stage=ErrorStage.LEXICAL,
                    error_code=ErrorCode.LEX001,
                    message=f'Invalid token "{word}"',
                    position=pos_index,
                    suggestion=f'Remove or replace the invalid token at position {pos_index}. '
                               f'Identifiers must start with a letter and contain only letters/digits.',
                    raw_input=word,
                ))
                # Still append an INVALID token so the parser can report position
                tokens.append(Token(
                    type=TokenType.INVALID,
                    lexeme=word,
                    position=pos_index,
                    char_position=char_pos,
                ))
            else:
                tokens.append(Token(
                    type=token_type,
                    lexeme=word,
                    position=pos_index,
                    char_position=char_pos,
                ))

        # Append EOF sentinel
        eof_pos = len(normalised)
        tokens.append(Token(type=TokenType.EOF, lexeme="", position=len(words) + 1, char_position=eof_pos))

        return LexerResult(tokens=tokens, errors=errors, raw_command=raw_command)

    def _classify(self, word: str) -> TokenType:
        """Classify a single uppercase word."""
        # Check keyword table first
        if word in KEYWORDS:
            return KEYWORDS[word]

        # Negative numbers (e.g. -10)
        if self._NUM_RE.match(word):
            return TokenType.NUMBER

        # Pure positive number
        if word.isdigit():
            return TokenType.NUMBER

        # Valid identifier: starts with letter, rest alphanumeric
        if self._IDENT_RE.match(word):
            return TokenType.IDENTIFIER

        return TokenType.INVALID
