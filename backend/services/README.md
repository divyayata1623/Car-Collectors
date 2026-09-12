# Authentication Service Documentation

## Overview

The `AuthService` class provides comprehensive authentication and authorization functionality for the CAR COLLECTORS e-commerce platform. It handles password hashing, JWT token management, user authentication, and role-based access control.

## Features

- ✅ **Password Hashing**: Bcrypt with cost factor 12
- ✅ **JWT Token Generation**: 7-day expiration by default
- ✅ **JWT Token Validation**: Signature and expiration checking
- ✅ **User Authentication**: Email/password validation
- ✅ **Role-Based Access Control**: Customer and Admin roles
- ✅ **FastAPI Dependencies**: Ready-to-use route protection

## Usage Examples

### 1. User Registration

```python
from sqlalchemy.orm import Session
from services.auth import AuthService
from schemas.user import UserCreate

def register_customer(db: Session, email: str, password: str, full_name: str):
    """Register a new customer."""
    user_data = UserCreate(
        email=email,
        password=password,
        full_name=full_name
    )
    
    user = AuthService.create_user(db, user_data, role="CUSTOMER")
    
    # Generate JWT token
    token = AuthService.create_access_token({
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return {"user": user, "access_token": token}
```

### 2. User Login

```python
from fastapi import HTTPException, status
from services.auth import AuthService

def login(db: Session, email: str, password: str):
    """Authenticate user and return JWT token."""
    user = AuthService.authenticate_user(db, email, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = AuthService.create_access_token({
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }
```

### 3. Protected Routes (Customer)

```python
from fastapi import APIRouter, Depends
from services.auth import get_current_user
from models.user import User

router = APIRouter()

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile (requires authentication)."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }

@router.get("/cart")
def get_cart(current_user: User = Depends(get_current_user)):
    """Get current user's cart (requires authentication)."""
    # Only authenticated users can access their cart
    return {"cart_items": []}
```

### 4. Admin-Only Routes

```python
from fastapi import APIRouter, Depends
from services.auth import get_current_admin
from models.user import User

admin_router = APIRouter()

@admin_router.get("/dashboard")
def get_dashboard(admin: User = Depends(get_current_admin)):
    """Admin dashboard (requires admin role)."""
    return {"message": "Admin dashboard data"}

@admin_router.post("/products")
def create_product(
    product_data: dict,
    admin: User = Depends(get_current_admin)
):
    """Create product (admin only)."""
    return {"message": "Product created"}
```

### 5. Manual Password Operations

```python
from services.auth import AuthService

# Hash a password
password = "mysecurepassword"
hashed = AuthService.hash_password(password)
# Result: $2b$12$... (60 characters)

# Verify password
is_valid = AuthService.verify_password(password, hashed)
# Result: True

# Verify wrong password
is_wrong = AuthService.verify_password("wrongpass", hashed)
# Result: False
```

### 6. Custom Token Expiration

```python
from datetime import timedelta
from services.auth import AuthService

# Create token with custom expiration (1 hour)
token = AuthService.create_access_token(
    data={
        "user_id": "123",
        "email": "user@example.com",
        "role": "CUSTOMER"
    },
    expires_delta=timedelta(hours=1)
)
```

### 7. Token Validation

```python
from fastapi import HTTPException
from services.auth import AuthService

def validate_token(token: str):
    """Validate and decode JWT token."""
    try:
        payload = AuthService.decode_token(token)
        user_id = payload["sub"]
        email = payload["email"]
        role = payload["role"]
        return {"user_id": user_id, "email": email, "role": role}
    except HTTPException as e:
        # Token is invalid or expired
        print(f"Token validation failed: {e.detail}")
        raise
```

## FastAPI Route Examples

### Complete Authentication Router

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserCreate, LoginRequest, LoginResponse, UserResponse
from services.auth import AuthService, get_current_user
from models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=LoginResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new customer account."""
    user = AuthService.create_user(db, user_data, role="CUSTOMER")
    
    token = AuthService.create_access_token({
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = AuthService.authenticate_user(
        db,
        credentials.email,
        credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = AuthService.create_access_token({
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user
```

## Environment Variables

The authentication service requires the following environment variables in `.env`:

```env
# JWT Configuration
SECRET_KEY=your-secret-key-here-min-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
```

## Security Features

### 1. Password Hashing
- **Algorithm**: Bcrypt
- **Cost Factor**: 12 (configurable, provides good security/performance balance)
- **Salt**: Unique random salt generated for each password
- **Output**: 60-character hash starting with `$2b$12$`

### 2. JWT Tokens
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days (configurable via environment)
- **Payload**: Contains user_id (sub), email, role, iat (issued at), exp (expires)
- **Signature**: Verified on every request

### 3. Constant-Time Comparison
- Password verification uses bcrypt's built-in constant-time comparison
- Prevents timing attacks

### 4. Role-Based Access Control
- `get_current_user`: Validates token and returns any authenticated user
- `get_current_admin`: Validates token AND checks for ADMIN role

## Error Handling

The service raises FastAPI `HTTPException` with appropriate status codes:

| Status Code | Scenario |
|-------------|----------|
| 401 | Invalid/expired token, invalid credentials |
| 403 | User is not admin (when admin required) |
| 409 | Email already exists during registration |

## Testing

Run the manual test to verify functionality:

```bash
python test_auth_manual.py
```

Expected output:
```
=== Testing Authentication Service ===
✓ Password hashing works
✓ Password verification works
✓ User creation works
✓ Authentication works
✓ JWT token generation works
✓ JWT token validation works
✓ Duplicate email prevention works
=== All Tests Passed! ===
```

## Best Practices

1. **Never log or expose JWT tokens** in error messages or responses
2. **Store tokens securely** on client side (httpOnly cookies or secure localStorage)
3. **Always use HTTPS** in production to protect tokens in transit
4. **Rotate SECRET_KEY periodically** for enhanced security
5. **Set appropriate token expiration** based on security requirements
6. **Implement token refresh** mechanism for long-lived sessions
7. **Validate tokens on every protected route** using dependencies

## Troubleshooting

### Issue: "Invalid or expired token"
- Token may have expired (check expiration time)
- Token signature may be invalid (SECRET_KEY changed)
- Token format may be malformed

### Issue: "Insufficient permissions"
- User role is not ADMIN when accessing admin routes
- Use `get_current_user` for customer routes, `get_current_admin` for admin routes

### Issue: "Email already registered"
- User with same email exists in database
- Check for duplicate emails before registration
- Consider implementing password reset instead

## Dependencies

Required packages:
- `passlib[bcrypt]>=1.7.4` - Password hashing
- `bcrypt>=4.0.0,<5.0.0` - Bcrypt implementation (v4.x for compatibility)
- `python-jose[cryptography]>=3.3.0` - JWT token handling
- `python-multipart>=0.0.6` - Form data support
