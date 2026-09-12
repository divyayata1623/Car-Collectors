"""
User-related Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID
import re


class UserCreate(BaseModel):
    """Schema for customer registration request."""
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=1, max_length=255)
    mobile: Optional[str] = Field(None, max_length=20)

    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        """Validate password is at least 8 characters."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserResponse(BaseModel):
    """Schema for user profile response."""
    id: str
    email: str
    full_name: str
    mobile: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
    
    @field_serializer('id')
    def serialize_id(self, value: UUID | str) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value) if isinstance(value, UUID) else value


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class LoginResponse(BaseModel):
    """Schema for login response with JWT token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
