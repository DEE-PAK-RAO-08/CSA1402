"""
Unit and Integration Tests for WICL Compiler Pipeline
=====================================================
Tests Lexer, Parser, Semantic Analyzer, and Command Execution.
Run with: pytest
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.compiler.lexer import Lexer
from app.compiler.parser import Parser
from app.compiler.semantic_analyzer import SemanticAnalyzer
from app.compiler.tokens import TokenType


def test_lexer_add_command():
    raw = "ADD 50 LAPTOP001 TO WH01;"
    lexer = Lexer(raw)
    tokens, errors = lexer.tokenize()

    assert len(errors) == 0
    assert len(tokens) == 7
    assert tokens[0].token_type == TokenType.ADD
    assert tokens[1].token_type == TokenType.NUMBER
    assert tokens[1].lexeme == "50"
    assert tokens[2].token_type == TokenType.IDENTIFIER
    assert tokens[2].lexeme == "LAPTOP001"
    assert tokens[3].token_type == TokenType.TO
    assert tokens[4].token_type == TokenType.IDENTIFIER
    assert tokens[4].lexeme == "WH01"
    assert tokens[5].token_type == TokenType.SEMICOLON
    assert tokens[6].token_type == TokenType.EOF


def test_lexer_invalid_character():
    raw = "ADD 50 LAPTOP001 @ WH01;"
    lexer = Lexer(raw)
    tokens, errors = lexer.tokenize()

    assert len(errors) > 0
    assert errors[0].error_stage == "LEXICAL"


def test_parser_add_command():
    raw = "ADD 50 LAPTOP001 TO WH01;"
    lexer = Lexer(raw)
    tokens, _ = lexer.tokenize()
    
    parser = Parser(tokens)
    ast, errors = parser.parse()

    assert len(errors) == 0
    assert ast is not None
    assert ast.item_id == "LAPTOP001"
    assert ast.quantity == 50
    assert ast.warehouse_id == "WH01"


def test_parser_transfer_command():
    raw = "TRANSFER 20 MOUSE001 FROM WH01 TO WH02;"
    lexer = Lexer(raw)
    tokens, _ = lexer.tokenize()
    
    parser = Parser(tokens)
    ast, errors = parser.parse()

    assert len(errors) == 0
    assert ast is not None
    assert ast.item_id == "MOUSE001"
    assert ast.quantity == 20
    assert ast.source_warehouse_id == "WH01"
    assert ast.destination_warehouse_id == "WH02"


def test_parser_syntax_error():
    raw = "ADD LAPTOP001 TO WH01;"  # Missing quantity number
    lexer = Lexer(raw)
    tokens, _ = lexer.tokenize()
    
    parser = Parser(tokens)
    ast, errors = parser.parse()

    assert len(errors) > 0
    assert errors[0].error_stage == "SYNTAX"
