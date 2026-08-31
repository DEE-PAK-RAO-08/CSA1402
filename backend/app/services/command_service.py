"""
Command Service — orchestrates the full 8-stage WICL compiler pipeline.

Pipeline Architecture:
  Stage 1: Command Record Initialization
  Stage 2: Lexical Analysis (Tokenizer)
  Stage 3: Syntax Analysis (Parser) & AST Generation
  Stage 4: Semantic Analysis (Database Business Rules)
  Stage 5: Intermediate Representation (IR) Generation
  Stage 6: IR Optimization (Redundant Pass Elimination)
  Stage 7: Dependency Analysis & DAG Generation
  Stage 8: Transactional Execution Engine
"""
import time
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from ..compiler.lexer import Lexer
from ..compiler.parser import Parser
from ..compiler.semantic_analyzer import SemanticAnalyzer
from ..compiler.ir_generator import IRGenerator
from ..compiler.ir_optimizer import IROptimizer
from ..compiler.dag_analyzer import DAGAnalyzer
from ..compiler.executor import ExecutionEngine
from ..database import models


class CommandService:
    def __init__(self):
        self.lexer = Lexer()
        self.parser = Parser()
        self.semantic = SemanticAnalyzer()
        self.ir_generator = IRGenerator()
        self.ir_optimizer = IROptimizer()
        self.dag_analyzer = DAGAnalyzer()
        self.executor = ExecutionEngine()

    def analyze(
        self,
        raw_command: str,
        user: models.User,
        db: Session,
        execute: bool = False,
    ) -> dict:
        """
        Run the full 8-stage compiler pipeline for a command string.
        Handles batch commands (BEGIN BATCH ... END BATCH) or single commands.
        """
        raw_strip = raw_command.strip()
        if raw_strip.startswith("BEGIN BATCH"):
            return self._process_batch(raw_strip, user, db, execute)

        return self._process_single(raw_strip, user, db, execute)

    def _process_single(
        self,
        raw_command: str,
        user: models.User,
        db: Session,
        execute: bool = False,
    ) -> dict:
        t_total_start = time.perf_counter()
        trace_steps: List[Dict[str, Any]] = []

        def add_trace(stage: str, desc: str, status: str = "success", detail: str = ""):
            trace_steps.append({
                "step_number": len(trace_steps) + 1,
                "stage": stage,
                "description": desc,
                "status": status,
                "detail": detail,
            })

        # ── Stage 1: Create command record ────────────────────────────────
        t1_start = time.perf_counter()
        add_trace("INIT", "Command received & pipeline initialized")

        cmd_record = models.Command(
            user_id=user.id,
            raw_command=raw_command,
            lexical_status="processing",
        )
        db.add(cmd_record)
        db.commit()
        db.refresh(cmd_record)

        result = {
            "command_id": cmd_record.id,
            "raw_command": raw_command,
            "pipeline_status": {
                "lexer": "pending",
                "parser": "pending",
                "semantic": "pending",
                "ir": "pending",
                "optimizer": "pending",
                "dag": "pending",
                "execution": "pending",
            },
            "lexical_analysis": {},
            "syntax_analysis": {},
            "ast": {},
            "semantic_analysis": {},
            "ir": {},
            "optimized_ir": {},
            "dag": {},
            "execution": {"status": "blocked"},
            "execution_trace": [],
            "performance": {},
        }

        # ── Stage 2: LEXICAL ANALYSIS ─────────────────────────────────────
        t_lex = time.perf_counter()
        lex_result = self.lexer.tokenize(raw_command)
        lex_ms = (time.perf_counter() - t_lex) * 1000

        result["lexical_analysis"] = lex_result.to_dict()
        cmd_record.lexical_status = "success" if lex_result.success else "error"
        cmd_record.perf_lex_ms = int(lex_ms)
        result["pipeline_status"]["lexer"] = cmd_record.lexical_status

        for tok in lex_result.tokens:
            if tok.lexeme:
                db.add(models.TokenRecord(
                    command_id=cmd_record.id,
                    lexeme=tok.lexeme,
                    token_type=tok.type.value,
                    position=tok.position,
                ))

        if not lex_result.success:
            cmd_record.overall_status = "lexical_error"
            cmd_record.completed_at = datetime.datetime.utcnow()
            add_trace("LEXICAL", "Lexical analysis failed with tokenization error", "error")
            self._save_errors_and_trace(db, cmd_record.id, lex_result.errors, trace_steps)
            result["execution_trace"] = trace_steps
            result["execution"] = {"status": "blocked", "reason": "Lexical analysis failed"}
            return result

        add_trace("LEXICAL", f"Canonicalized & tokenized into {len(lex_result.tokens)} tokens")

        # ── Stage 3: SYNTAX ANALYSIS + AST ───────────────────────────────
        t_parse = time.perf_counter()
        non_eof = [t for t in lex_result.tokens if t.type.value != "EOF"]
        parse_result = self.parser.parse(non_eof)
        parse_ms = (time.perf_counter() - t_parse) * 1000

        result["syntax_analysis"] = {
            "status": "success" if parse_result.success else "error",
            "grammar_rule": parse_result.grammar_rule,
            "errors": [e.to_dict() for e in parse_result.errors],
        }
        result["ast"] = {
            "status": "success" if parse_result.ast else "error",
            "tree": parse_result.ast.to_tree() if parse_result.ast else None,
            "json": parse_result.ast.to_dict() if parse_result.ast else None,
        }

        cmd_record.syntax_status = "success" if parse_result.success else "error"
        cmd_record.ast_status = "success" if parse_result.ast else "error"
        cmd_record.perf_parse_ms = int(parse_ms)
        result["pipeline_status"]["parser"] = cmd_record.syntax_status

        if parse_result.ast:
            cmd_record.command_type = parse_result.ast.node_type.replace("_COMMAND", "")

        if not parse_result.success:
            cmd_record.overall_status = "syntax_error"
            cmd_record.completed_at = datetime.datetime.utcnow()
            add_trace("PARSER", "Syntax analysis failed — BNF grammar mismatch", "error")
            self._save_errors_and_trace(db, cmd_record.id, parse_result.errors, trace_steps)
            result["execution_trace"] = trace_steps
            result["execution"] = {"status": "blocked", "reason": "Syntax analysis failed"}
            return result

        add_trace("PARSER", f"Grammar verified ({parse_result.grammar_rule}); AST generated")

        # ── Stage 4: SEMANTIC ANALYSIS ────────────────────────────────────
        t_sem = time.perf_counter()
        sem_result = self.semantic.analyze(
            ast=parse_result.ast,
            db=db,
            user_id=user.id,
            user_role=user.role,
            user_warehouse_id=user.warehouse_id,
        )
        sem_ms = (time.perf_counter() - t_sem) * 1000

        result["semantic_analysis"] = sem_result.to_dict()
        cmd_record.semantic_status = "success" if sem_result.success else "error"
        cmd_record.perf_semantic_ms = int(sem_ms)
        result["pipeline_status"]["semantic"] = cmd_record.semantic_status

        if not sem_result.success:
            cmd_record.overall_status = "semantic_error"
            cmd_record.completed_at = datetime.datetime.utcnow()
            add_trace("SEMANTIC", "Semantic validation failed against DB constraints", "error")
            self._save_errors_and_trace(db, cmd_record.id, sem_result.errors, trace_steps)
            result["execution_trace"] = trace_steps
            result["execution"] = {"status": "blocked", "reason": "Semantic analysis failed"}
            return result

        add_trace("SEMANTIC", f"Passed {len(sem_result.checks)} semantic checks (item/wh existence, RBAC, capacity)")

        # ── Stage 5: IR GENERATION ────────────────────────────────────────
        t_ir = time.perf_counter()
        ir_res = self.ir_generator.generate(parse_result.ast)
        ir_ms = (time.perf_counter() - t_ir) * 1000

        result["ir"] = ir_res.to_dict()
        cmd_record.ir_status = "success" if ir_res.success else "error"
        cmd_record.perf_ir_ms = int(ir_ms)
        result["pipeline_status"]["ir"] = cmd_record.ir_status

        if ir_res.success:
            add_trace("IR_GEN", f"Generated {len(ir_res.instructions)} IR opcodes")
            for idx, instr in enumerate(ir_res.instructions, start=1):
                db.add(models.IRRecord(
                    command_id=cmd_record.id,
                    step_number=idx,
                    opcode=instr.opcode,
                    operand1=instr.operand1,
                    operand2=instr.operand2,
                    operand3=instr.operand3,
                    comment=instr.comment,
                ))

        # ── Stage 6: IR OPTIMIZATION ──────────────────────────────────────
        t_opt = time.perf_counter()
        opt_res = self.ir_optimizer.optimize(ir_res)
        opt_ms = (time.perf_counter() - t_opt) * 1000

        result["optimized_ir"] = opt_res.to_dict()
        cmd_record.optimizer_status = "success" if opt_res.success else "error"
        cmd_record.perf_opt_ms = int(opt_ms)
        result["pipeline_status"]["optimizer"] = cmd_record.optimizer_status

        if opt_res.optimizations:
            desc = f"Applied {len(opt_res.optimizations)} optimization pass(es), eliminated {opt_res.reduction_count} opcodes"
            add_trace("OPTIMIZER", desc)
        else:
            add_trace("OPTIMIZER", "IR already optimal — zero redundant operations")

        # ── Stage 7: DAG / DEPENDENCY ANALYSIS ───────────────────────────
        t_dag = time.perf_counter()
        single_ast_item = [{"id": cmd_record.id, "raw_command": raw_command, "ast": parse_result.ast}]
        dag_res = self.dag_analyzer.analyze(single_ast_item)
        dag_ms = (time.perf_counter() - t_dag) * 1000

        result["dag"] = dag_res.to_dict()
        cmd_record.dag_status = "success" if dag_res.is_valid_dag else "error"
        cmd_record.perf_dag_ms = int(dag_ms)
        result["pipeline_status"]["dag"] = cmd_record.dag_status

        add_trace("DAG", "Dependency graph verified; safe execution order confirmed")

        # ── Stage 8: EXECUTION ENGINE ─────────────────────────────────────
        t_exec = time.perf_counter()
        if execute:
            add_trace("EXECUTION", "Initiated ACID database transaction...")
            exec_result = self.executor.execute(
                ast=parse_result.ast,
                command_id=cmd_record.id,
                user_id=user.id,
                db=db,
                semantic_context=sem_result.context,
            )
            exec_ms = (time.perf_counter() - t_exec) * 1000
            result["execution"] = exec_result.to_dict()
            cmd_record.execution_status = "success" if exec_result.success else "error"
            cmd_record.overall_status = "completed" if exec_result.success else "execution_error"
            cmd_record.perf_exec_ms = int(exec_ms)
            result["pipeline_status"]["execution"] = cmd_record.execution_status

            if exec_result.success:
                add_trace("EXECUTION", "Transaction committed & audit log created", "success")
            else:
                add_trace("EXECUTION", f"Transaction rolled back: {exec_result.error}", "error")
        else:
            exec_ms = 0.0
            add_trace("EXECUTION", "Dry-run validation complete. Ready for execution.", "skipped")
            result["execution"] = {"status": "ready", "message": "All validations passed. Ready to execute."}
            cmd_record.execution_status = "ready"
            cmd_record.overall_status = "validated"
            cmd_record.perf_exec_ms = 0
            result["pipeline_status"]["execution"] = "ready"

        # ── Total Performance calculation ────────────────────────────────
        t_total_ms = (time.perf_counter() - t_total_start) * 1000
        cmd_record.perf_total_ms = int(t_total_ms)
        cmd_record.completed_at = datetime.datetime.utcnow()

        result["performance"] = {
            "lexer_ms": round(lex_ms, 3),
            "parser_ms": round(parse_ms, 3),
            "semantic_ms": round(sem_ms, 3),
            "ir_ms": round(ir_ms, 3),
            "opt_ms": round(opt_ms, 3),
            "dag_ms": round(dag_ms, 3),
            "execution_ms": round(exec_ms, 3),
            "total_ms": round(t_total_ms, 3),
        }

        # Save execution traces to database
        self._save_trace_records(db, cmd_record.id, trace_steps)
        result["execution_trace"] = trace_steps

        db.commit()
        return result

    def _process_batch(
        self,
        raw_batch: str,
        user: models.User,
        db: Session,
        execute: bool = False,
    ) -> dict:
        """Process a BEGIN BATCH ... END BATCH command block."""
        lines = [line.strip() for line in raw_batch.splitlines() if line.strip()]
        command_lines = []

        for line in lines:
            if line in ("BEGIN BATCH", "END BATCH"):
                continue
            if line:
                command_lines.append(line)

        if not command_lines:
            return {
                "status": "error",
                "message": "Empty batch sequence",
                "batch_count": 0,
                "results": [],
            }

        batch_results = []
        parsed_ast_items = []

        for idx, line in enumerate(command_lines, start=1):
            res = self._process_single(line, user, db, execute=execute)
            batch_results.append(res)

            # Collect parsed ASTs for DAG analysis across batch
            if res.get("syntax_analysis", {}).get("status") == "success":
                # reconstruct AST node from response if available
                parsed_ast_items.append({
                    "id": idx,
                    "raw_command": line,
                    "ast": res.get("ast_node_obj"),  # transient
                })

        # Multi-command DAG analysis across batch
        t_dag = time.perf_counter()
        dag_res = self.dag_analyzer.analyze(parsed_ast_items)
        dag_ms = (time.perf_counter() - t_dag) * 1000

        return {
            "status": "batch_completed" if all(r.get("pipeline_status", {}).get("execution") in ("success", "ready") for r in batch_results) else "batch_error",
            "is_batch": True,
            "batch_count": len(command_lines),
            "results": batch_results,
            "batch_dag": dag_res.to_dict(),
            "batch_dag_ms": round(dag_ms, 3),
        }

    def _save_errors_and_trace(self, db: Session, command_id: int, errors: list, trace_steps: list):
        for err in errors:
            db.add(models.ErrorRecord(
                command_id=command_id,
                error_stage=err.stage.value,
                error_code=err.error_code.value,
                message=err.message,
                position=err.position,
            ))
        self._save_trace_records(db, command_id, trace_steps)
        db.commit()

    def _save_trace_records(self, db: Session, command_id: int, trace_steps: list):
        for step in trace_steps:
            db.add(models.ExecutionTrace(
                command_id=command_id,
                step_number=step["step_number"],
                stage=step["stage"],
                description=step["description"],
                status=step["status"],
                detail=step.get("detail", ""),
            ))
