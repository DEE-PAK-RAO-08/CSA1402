"""FastAPI dependency for extracting current user from JWT."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..database import models
from ..services.auth_service import get_current_user_from_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    user = get_current_user_from_token(token, db)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_operator_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ("admin", "operator"):
        raise HTTPException(status_code=403, detail="Operator or admin access required")
    return current_user
