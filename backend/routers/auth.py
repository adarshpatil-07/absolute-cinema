from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from auth import create_access_token, get_current_user, hash_password, verify_password
from db import get_session
from models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    session: Session = Depends(get_session),
) -> User:
    existing_email = session.exec(
        select(User).where(User.email == str(request.email))
    ).first()
    existing_username = session.exec(
        select(User).where(User.username == request.username)
    ).first()
    if existing_email or existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or username is already registered.",
        )

    user = User(
        email=str(request.email),
        username=request.username,
        hashed_password=hash_password(request.password),
    )
    session.add(user)
    try:
        session.commit()
        session.refresh(user)
    except IntegrityError:
        session.rollback()
        duplicate_email = session.exec(
            select(User).where(User.email == str(request.email))
        ).first()
        duplicate_username = session.exec(
            select(User).where(User.username == request.username)
        ).first()
        if duplicate_email or duplicate_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email or username is already registered.",
            ) from None
        raise
    return user


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    user = session.exec(
        select(User).where(User.email == str(request.email))
    ).first()
    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if user.id is None:
        raise RuntimeError("User record is missing its database ID.")
    return TokenResponse(
        access_token=create_access_token(user.id),
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user
