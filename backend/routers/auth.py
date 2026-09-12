"""
Authentication routes for user registration and login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from services.auth import AuthService, get_current_user
from schemas.user import UserCreate, UserResponse, LoginRequest, LoginResponse
from models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new customer account.
    """
    user = AuthService.create_user(db, user_data, role="CUSTOMER")
    return user


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password to receive JWT access token.
    """
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Generate JWT token
    access_token = AuthService.create_access_token(data={
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    # Convert user object to dict and ensure id is string
    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "mobile": user.mobile,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_dict)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile (requires authentication).
    """
    return current_user
