"""
WICL Parser (Recursive Descent)
================================
Receives the token stream from the Lexer and validates it against
the WICL grammar, producing an AST node on success.

The parser is grammar-driven: it uses the GRAMMAR_RULES table to know
what token type to expect at each position, and generates specific,
actionable error messages when the actual token does not match.
"""
from typing import List, Optional
from .tokens import Token, TokenType, COMMAND_KEYWORDS
from .ast_nodes import (
    ASTNode, AddCommandNode, RemoveCommandNode,
    TransferCommandNode, CheckCommandNode, UpdateCommandNode, CommandType
)
from .grammar import (
    GRAMMAR_RULES, COMMAND_RULE_MAP,
    RULE_POSITION_LABELS, CORRECTION_TEMPLATES
)
from .error_handler import CompilerError, ErrorStage, ErrorCode


class ParseResult:
    def __init__(
        self,
        ast: Optional[ASTNode],
        errors: List[CompilerError],
        grammar_rule: Optional[str],
        tokens_consumed: int,
    ):
        self.ast = ast
        self.errors = errors
        self.grammar_rule = grammar_rule
        self.tokens_consumed = tokens_consumed
        self.success = ast is not None and len(errors) == 0

    def to_dict(self) -> dict:
        return {
            "status": "success" if self.success else "error",
            "grammar_rule": self.grammar_rule,
            "ast": self.ast.to_dict() if self.ast else None,
            "ast_tree": self.ast.to_tree() if self.ast else None,
            "errors": [e.to_dict() for e in self.errors],
            "tokens_consumed": self.tokens_consumed,
        }


class Parser:
    """
    Grammar-driven recursive-descent parser for WICL.

    Approach:
      1. Peek at first token to determine which grammar rule to apply
      2. Walk through the expected token sequence for that rule
      3. At each step, check actual vs expected; on mismatch emit SYN error
      4. On full match, construct the appropriate AST node
    """

    def __init__(self):
        self._tokens: List[Token] = []
        self._pos: int = 0

    def parse(self, tokens: List[Token]) -> ParseResult:
        # Filter out INVALID tokens (lexer already reported those errors)
        # but keep their positions for error reporting.
        self._tokens = [t for t in tokens if t.type != TokenType.EOF]
        self._pos = 0
        errors: List[CompilerError] = []

        if not self._tokens:
            errors.append(CompilerError(
                stage=ErrorStage.SYNTAX,
                error_code=ErrorCode.SYN001,
                message="Empty command — no tokens to parse",
                suggestion="Enter a valid WICL command, e.g.: ADD ITEM LAPTOP001 QUANTITY 50 LOCATION WH01",
            ))
            return ParseResult(ast=None, errors=errors, grammar_rule=None, tokens_consumed=0)

        # Identify command verb
        first_token = self._tokens[0]

        if first_token.type == TokenType.INVALID:
            errors.append(CompilerError(
                stage=ErrorStage.SYNTAX,
                error_code=ErrorCode.SYN004,
                message=f'Unknown command verb "{first_token.lexeme}"',
                position=1,
                suggestion="Valid command verbs are: ADD, REMOVE, TRANSFER, CHECK, UPDATE",
                raw_input=first_token.lexeme,
            ))
            return ParseResult(ast=None, errors=errors, grammar_rule=None, tokens_consumed=1)

        if first_token.type not in COMMAND_RULE_MAP:
            errors.append(CompilerError(
                stage=ErrorStage.SYNTAX,
                error_code=ErrorCode.SYN004,
                message=f'"{first_token.lexeme}" is not a valid command verb',
                position=1,
                suggestion="Valid command verbs are: ADD, REMOVE, TRANSFER, CHECK, UPDATE",
                raw_input=first_token.lexeme,
            ))
            return ParseResult(ast=None, errors=errors, grammar_rule=None, tokens_consumed=1)

        rule_name = COMMAND_RULE_MAP[first_token.type]
        expected_sequence = GRAMMAR_RULES[rule_name]
        position_labels = RULE_POSITION_LABELS[rule_name]

        # Walk the expected token sequence
        matched_lexemes: List[str] = []
        parse_errors: List[CompilerError] = []

        for idx, expected_type in enumerate(expected_sequence):
            actual = self._peek(idx)

            if actual is None:
                # Command ended prematurely
                parse_errors.append(CompilerError(
                    stage=ErrorStage.SYNTAX,
                    error_code=ErrorCode.SYN001,
                    message=f"Command ended prematurely at position {idx + 1}. "
                            f"Expected {position_labels.get(idx, expected_type.value)}",
                    position=idx + 1,
                    suggestion=f"Complete the command: {CORRECTION_TEMPLATES[rule_name]}",
                ))
                break

            if not self._matches(actual, expected_type):
                expected_label = position_labels.get(idx, expected_type.value)
                parse_errors.append(CompilerError(
                    stage=ErrorStage.SYNTAX,
                    error_code=ErrorCode.SYN001 if expected_type != TokenType.NUMBER else ErrorCode.SYN002,
                    message=f'Expected {expected_label}, but got "{actual.lexeme}"',
                    position=actual.position,
                    suggestion=self._build_suggestion(rule_name, idx, actual),
                    raw_input=actual.lexeme,
                ))
                # Continue checking remaining tokens to surface all errors
                matched_lexemes.append(actual.lexeme)
            else:
                matched_lexemes.append(actual.lexeme)

        if parse_errors:
            return ParseResult(
                ast=None,
                errors=parse_errors,
                grammar_rule=rule_name,
                tokens_consumed=min(len(self._tokens), len(expected_sequence)),
            )

        # Check for extra tokens beyond expected grammar
        if len(self._tokens) > len(expected_sequence):
            extra = self._tokens[len(expected_sequence):]
            parse_errors.append(CompilerError(
                stage=ErrorStage.SYNTAX,
                error_code=ErrorCode.SYN003,
                message=f'Unexpected extra tokens after command: {" ".join(t.lexeme for t in extra)}',
                position=extra[0].position,
                suggestion=f"A {rule_name.replace('_', ' ')} ends at position {len(expected_sequence)}. "
                           f"Remove extra tokens.",
            ))
            return ParseResult(
                ast=None,
                errors=parse_errors,
                grammar_rule=rule_name,
                tokens_consumed=len(self._tokens),
            )

        # ── Build AST node ─────────────────────────────────────────────────
        ast = self._build_ast(rule_name, matched_lexemes)
        return ParseResult(
            ast=ast,
            errors=[],
            grammar_rule=rule_name,
            tokens_consumed=len(expected_sequence),
        )

    # ── Helpers ────────────────────────────────────────────────────────────

    def _peek(self, offset: int) -> Optional[Token]:
        if offset < len(self._tokens):
            return self._tokens[offset]
        return None

    def _matches(self, token: Token, expected: TokenType) -> bool:
        if expected == TokenType.IDENTIFIER:
            return token.type in (TokenType.IDENTIFIER,)
        if expected == TokenType.NUMBER:
            return token.type == TokenType.NUMBER
        return token.type == expected

    def _build_suggestion(self, rule_name: str, failed_pos: int, actual_token: Token) -> str:
        template = CORRECTION_TEMPLATES[rule_name]
        labels = RULE_POSITION_LABELS[rule_name]
        expected = labels.get(failed_pos, "correct value")
        return (
            f'At position {failed_pos + 1}, expected {expected} but received "{actual_token.lexeme}". '
            f"Correct format: {template}"
        )

    def _build_ast(self, rule_name: str, lexemes: List[str]) -> ASTNode:
        """Construct the appropriate AST node from matched lexemes."""
        if rule_name == "ADD_COMMAND":
            return AddCommandNode(
                item_id=lexemes[2],
                quantity=int(lexemes[4]),
                warehouse_id=lexemes[6],
            )
        elif rule_name == "REMOVE_COMMAND":
            return RemoveCommandNode(
                item_id=lexemes[2],
                quantity=int(lexemes[4]),
                warehouse_id=lexemes[6],
            )
        elif rule_name == "TRANSFER_COMMAND":
            return TransferCommandNode(
                item_id=lexemes[2],
                quantity=int(lexemes[4]),
                source_warehouse_id=lexemes[6],
                destination_warehouse_id=lexemes[8],
            )
        elif rule_name == "CHECK_COMMAND":
            return CheckCommandNode(
                item_id=lexemes[2],
                warehouse_id=lexemes[4],
            )
        elif rule_name == "UPDATE_COMMAND":
            return UpdateCommandNode(
                item_id=lexemes[2],
                quantity=int(lexemes[4]),
                warehouse_id=lexemes[6],
            )
        raise ValueError(f"Unknown rule: {rule_name}")
