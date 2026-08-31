"""Auth API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..services.auth_service import authenticate_user, create_access_token, hash_password
from ..schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from .deps import get_current_user
from ..database import models

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="You are restricted by admin")

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check username uniqueness
    existing = db.query(models.User).filter(models.User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken. Please choose a different username.")
    # Validate username format (alphanumeric + underscore)
    import re
    if not re.match(r'^[a-zA-Z0-9_]{3,32}$', request.username):
        raise HTTPException(status_code=400, detail="Username must be 3–32 characters: letters, numbers, or underscores.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = models.User(
        username=request.username,
        password_hash=hash_password(request.password),
        role="viewer",  # self-registered accounts are viewer by default
        is_active=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/logout")
def logout(current_user: models.User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
