"""Commands API routes — the main compiler pipeline endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.database import get_db
from ..database import models
from ..schemas.schemas import CommandRequest, CommandOut
from ..services.command_service import CommandService
from .deps import get_current_user, require_operator_or_admin

router = APIRouter(prefix="/commands", tags=["Commands"])
command_service = CommandService()


@router.post("/analyze")
def analyze_command(
    request: CommandRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Analyze a WICL command through the full compiler pipeline.
    If execute=True, also run the execution engine (operator/admin only).
    """
    if request.execute and current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot execute commands")

    result = command_service.analyze(
        raw_command=request.command.strip(),
        user=current_user,
        db=db,
        execute=request.execute,
    )
    return result


@router.post("/batch")
def analyze_batch(
    request: CommandRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Analyze or execute a batch of WICL commands."""
    if request.execute and current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot execute commands")

    return command_service.analyze(
        raw_command=request.command.strip(),
        user=current_user,
        db=db,
        execute=request.execute,
    )


@router.get("/stats/performance")
def compiler_performance_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return aggregated compiler pipeline performance statistics across all commands."""
    from sqlalchemy import func
    commands = db.query(models.Command).all()
    total = len(commands)
    if total == 0:
        return {
            "total_commands": 0,
            "success_rate": 0,
            "avg_lex_ms": 0,
            "avg_parse_ms": 0,
            "avg_semantic_ms": 0,
            "avg_ir_ms": 0,
            "avg_opt_ms": 0,
            "avg_dag_ms": 0,
            "avg_exec_ms": 0,
            "avg_total_ms": 0,
        }

    successful = sum(1 for c in commands if c.overall_status in ("completed", "validated"))

    def avg_val(attr):
        vals = [getattr(c, attr) for c in commands if getattr(c, attr) is not None]
        return round(sum(vals) / len(vals), 2) if vals else 0.0

    return {
        "total_commands": total,
        "successful_commands": successful,
        "failed_commands": total - successful,
        "success_rate": round((successful / total) * 100, 1),
        "avg_lex_ms": avg_val("perf_lex_ms"),
        "avg_parse_ms": avg_val("perf_parse_ms"),
        "avg_semantic_ms": avg_val("perf_semantic_ms"),
        "avg_ir_ms": avg_val("perf_ir_ms"),
        "avg_opt_ms": avg_val("perf_opt_ms"),
        "avg_dag_ms": avg_val("perf_dag_ms"),
        "avg_exec_ms": avg_val("perf_exec_ms"),
        "avg_total_ms": avg_val("perf_total_ms"),
    }


@router.get("/", response_model=List[dict])
def list_commands(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Command)
    if current_user.role != "admin":
        query = query.filter(models.Command.user_id == current_user.id)
    commands = query.order_by(models.Command.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for cmd in commands:
        user = db.query(models.User).filter(models.User.id == cmd.user_id).first()
        result.append({
            "id": cmd.id,
            "user_id": cmd.user_id,
            "username": user.username if user else "unknown",
            "raw_command": cmd.raw_command,
            "command_type": cmd.command_type,
            "lexical_status": cmd.lexical_status,
            "syntax_status": cmd.syntax_status,
            "ast_status": cmd.ast_status,
            "semantic_status": cmd.semantic_status,
            "ir_status": getattr(cmd, "ir_status", "n/a"),
            "optimizer_status": getattr(cmd, "optimizer_status", "n/a"),
            "dag_status": getattr(cmd, "dag_status", "n/a"),
            "execution_status": cmd.execution_status,
            "overall_status": cmd.overall_status,
            "perf_total_ms": getattr(cmd, "perf_total_ms", 0),
            "created_at": cmd.created_at.isoformat() if cmd.created_at else None,
            "completed_at": cmd.completed_at.isoformat() if cmd.completed_at else None,
        })
    return result


@router.get("/{command_id}")
def get_command(
    command_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cmd = db.query(models.Command).filter(models.Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    if current_user.role != "admin" and cmd.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tokens = [{"lexeme": t.lexeme, "token_type": t.token_type, "position": t.position}
              for t in cmd.tokens]
    errors = [{"error_stage": e.error_stage, "error_code": e.error_code,
               "message": e.message, "position": e.position}
              for e in cmd.errors]
    txns = [{"id": t.id, "transaction_type": t.transaction_type, "status": t.status,
              "quantity": t.quantity} for t in cmd.transactions]
    ir_recs = [{"step": r.step_number, "opcode": r.opcode, "op1": r.operand1,
                "op2": r.operand2, "op3": r.operand3, "comment": r.comment}
               for r in getattr(cmd, "ir_records", [])]
    traces = [{"step": t.step_number, "stage": t.stage, "description": t.description,
               "status": t.status, "detail": t.detail}
              for t in getattr(cmd, "execution_traces", [])]
    user = db.query(models.User).filter(models.User.id == cmd.user_id).first()

    return {
        "id": cmd.id,
        "username": user.username if user else "unknown",
        "raw_command": cmd.raw_command,
        "command_type": cmd.command_type,
        "lexical_status": cmd.lexical_status,
        "syntax_status": cmd.syntax_status,
        "ast_status": cmd.ast_status,
        "semantic_status": cmd.semantic_status,
        "ir_status": getattr(cmd, "ir_status", "n/a"),
        "optimizer_status": getattr(cmd, "optimizer_status", "n/a"),
        "dag_status": getattr(cmd, "dag_status", "n/a"),
        "execution_status": cmd.execution_status,
        "overall_status": cmd.overall_status,
        "performance": {
            "lex_ms": getattr(cmd, "perf_lex_ms", 0),
            "parse_ms": getattr(cmd, "perf_parse_ms", 0),
            "semantic_ms": getattr(cmd, "perf_semantic_ms", 0),
            "ir_ms": getattr(cmd, "perf_ir_ms", 0),
            "opt_ms": getattr(cmd, "perf_opt_ms", 0),
            "dag_ms": getattr(cmd, "perf_dag_ms", 0),
            "exec_ms": getattr(cmd, "perf_exec_ms", 0),
            "total_ms": getattr(cmd, "perf_total_ms", 0),
        },
        "created_at": cmd.created_at.isoformat() if cmd.created_at else None,
        "completed_at": cmd.completed_at.isoformat() if cmd.completed_at else None,
        "tokens": tokens,
        "errors": errors,
        "transactions": txns,
        "ir_records": ir_recs,
        "execution_traces": traces,
    }

