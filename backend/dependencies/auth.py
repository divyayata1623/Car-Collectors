"""
Authentication and authorization dependencies for FastAPI routes.

This module provides FastAPI dependency functions that handle JWT token validation,
user authentication, and role-based authorization. Dependencies can be used in route
handlers to protect endpoints and ensure proper authentication.

Example:
    @router.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"user_id": current_user.id}
    
    @router.get("/admin-only")
    async def admin_route(current_admin: User = Depends(get_current_admin)):
        return {"admin_id": current_admin.id}
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services.auth import AuthService

# HTTP Bearer token scheme for automatic credential extraction
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract and validate JWT token from Authorization header and return authenticated user.
    
    This is a FastAPI dependency function that:
    1. Extracts the JWT token from the Authorization: Bearer <token> header
    2. Validates and decodes the token using the secret key
    3. Retrieves the corresponding user from the database
    4. Verifies the user is active
    
    Preconditions:
    - credentials must contain a valid Bearer token in the Authorization header
    - db session must be available and connected
    - SECRET_KEY must be configured in environment variables
    
    Postconditions:
    - Returns a valid User object from the database
    - User has role in ('ADMIN', 'CUSTOMER')
    - User has is_active = True
    
    Args:
        credentials: HTTP Bearer credentials extracted from Authorization header
        db: SQLAlchemy database session (injected by FastAPI)
    
    Returns:
        User: The authenticated user object
    
    Raises:
        HTTPException (401): If token is missing, invalid, expired, or payload is malformed
        HTTPException (401): If user cannot be found in database
        HTTPException (403): If user account is inactive
    
    Example:
        @app.get("/me")
        async def get_profile(current_user: User = Depends(get_current_user)):
            return current_user
    """
    token = credentials.credentials
    
    # Decode and validate JWT token
    try:
        payload = AuthService.decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload - missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        # Re-raise auth service exceptions
        raise
    except JWTError:
        # Catch any JWT decoding errors not handled by AuthService
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Retrieve user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user has ADMIN role.
    
    This dependency builds on get_current_user() to add role-based authorization.
    It ensures that only users with role='ADMIN' can access protected admin endpoints.
    
    Preconditions:
    - current_user must be obtained from get_current_user() dependency
    - current_user must be an active user from the database
    
    Postconditions:
    - Returns the same User object if role='ADMIN'
    - Raises HTTPException(403) if role != 'ADMIN'
    
    Args:
        current_user: Currently authenticated user (injected from get_current_user)
    
    Returns:
        User: The authenticated admin user object
    
    Raises:
        HTTPException (403): If user role is not 'ADMIN'
    
    Example:
        @router.delete("/products/{id}")
        async def delete_product(
            product_id: str,
            current_admin: User = Depends(get_current_admin)
        ):
            # Only accessible by admin users
            return {"deleted": product_id}
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required."
        )
    
    return current_user


def get_current_customer(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user has CUSTOMER role.
    
    This dependency ensures that only users with role='CUSTOMER' can access
    protected customer-specific endpoints.
    
    Preconditions:
    - current_user must be obtained from get_current_user() dependency
    - current_user must be an active user from the database
    
    Postconditions:
    - Returns the same User object if role='CUSTOMER'
    - Raises HTTPException(403) if role != 'CUSTOMER'
    
    Args:
        current_user: Currently authenticated user (injected from get_current_user)
    
    Returns:
        User: The authenticated customer user object
    
    Raises:
        HTTPException (403): If user role is not 'CUSTOMER'
    
    Example:
        @router.post("/orders")
        async def create_order(
            order_data: OrderCreate,
            current_customer: User = Depends(get_current_customer)
        ):
            # Only accessible by customer users
            return create_order_for_customer(current_customer.id, order_data)
    """
    if current_user.role != "CUSTOMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Customer role required."
        )
    
    return current_user
