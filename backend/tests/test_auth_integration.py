"""
Integration tests for AuthService using PostgreSQL database.
Tests the complete authentication flow with actual database operations.
"""
import pytest
from datetime import timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models.user import User
from schemas.user import UserCreate
from services.auth import AuthService


@pytest.fixture
def db():
    """Create database session for testing."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        # Cleanup: delete test users
        session.query(User).filter(User.email.like('%@test.example.com')).delete()
        session.commit()
        session.close()


class TestAuthServiceIntegration:
    """Integration tests for AuthService with PostgreSQL."""
    
    def test_create_customer_and_authenticate(self, db: Session):
        """Test complete flow: create user, authenticate, verify password."""
        # Create user
        user_data = UserCreate(
            email="customer@test.example.com",
            password="securepass123",
            full_name="Test Customer",
            mobile="9876543210"
        )
        
        created_user = AuthService.create_user(db, user_data, role="CUSTOMER")
        
        # Verify user was created correctly
        assert created_user.email == "customer@test.example.com"
        assert created_user.full_name == "Test Customer"
        assert created_user.mobile == "9876543210"
        assert created_user.role == "CUSTOMER"
        assert created_user.is_active is True
        assert len(created_user.password_hash) == 60
        assert created_user.password_hash.startswith("$2b$12$")
        
        # Authenticate with correct password
        auth_user = AuthService.authenticate_user(db, "customer@test.example.com", "securepass123")
        assert auth_user is not None
        assert auth_user.id == created_user.id
        
        # Authenticate with wrong password
        auth_user_fail = AuthService.authenticate_user(db, "customer@test.example.com", "wrongpassword")
        assert auth_user_fail is None
    
    def test_create_admin_user(self, db: Session):
        """Test creating admin user with admin role."""
        user_data = UserCreate(
            email="admin@test.example.com",
            password="adminpass456",
            full_name="Test Admin"
        )
        
        admin_user = AuthService.create_user(db, user_data, role="ADMIN")
        
        assert admin_user.email == "admin@test.example.com"
        assert admin_user.role == "ADMIN"
        assert admin_user.is_active is True
    
    def test_duplicate_email_raises_conflict(self, db: Session):
        """Test that creating user with duplicate email raises HTTPException."""
        # Create first user
        user_data1 = UserCreate(
            email="duplicate@test.example.com",
            password="password123",
            full_name="First User"
        )
        AuthService.create_user(db, user_data1, role="CUSTOMER")
        
        # Try to create second user with same email
        user_data2 = UserCreate(
            email="duplicate@test.example.com",
            password="different456",
            full_name="Second User"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            AuthService.create_user(db, user_data2, role="CUSTOMER")
        
        assert exc_info.value.status_code == 409
        assert "Email already registered" in exc_info.value.detail
    
    def test_jwt_token_generation_and_validation(self, db: Session):
        """Test JWT token generation and decoding."""
        # Create user
        user_data = UserCreate(
            email="tokentest@test.example.com",
            password="password123",
            full_name="Token Test User"
        )
        user = AuthService.create_user(db, user_data, role="CUSTOMER")
        
        # Generate token
        token_data = {
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role
        }
        token = AuthService.create_access_token(token_data)
        
        # Decode and verify token
        decoded = AuthService.decode_token(token)
        assert decoded["sub"] == str(user.id)
        assert decoded["email"] == user.email
        assert decoded["role"] == "CUSTOMER"
        assert "exp" in decoded
        assert "iat" in decoded
    
    def test_jwt_token_with_custom_expiration(self, db: Session):
        """Test JWT token with custom expiration time."""
        user_data = UserCreate(
            email="expiry@test.example.com",
            password="password123",
            full_name="Expiry Test"
        )
        user = AuthService.create_user(db, user_data, role="CUSTOMER")
        
        # Generate token with 1 hour expiration
        token_data = {
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role
        }
        token = AuthService.create_access_token(token_data, expires_delta=timedelta(hours=1))
        
        decoded = AuthService.decode_token(token)
        assert decoded["sub"] == str(user.id)
    
    def test_password_hashing_bcrypt_cost_factor_12(self):
        """Verify bcrypt cost factor is set to 12."""
        password = "testpassword"
        hashed = AuthService.hash_password(password)
        
        # Extract cost factor from bcrypt hash (format: $2b$12$...)
        parts = hashed.split("$")
        cost_factor = int(parts[2])
        
        assert cost_factor == 12
    
    def test_password_verification_constant_time(self):
        """Test that password verification works correctly."""
        password = "correctpassword"
        hashed = AuthService.hash_password(password)
        
        # Correct password should verify
        assert AuthService.verify_password(password, hashed) is True
        
        # Wrong password should not verify
        assert AuthService.verify_password("wrongpassword", hashed) is False
    
    def test_authenticate_nonexistent_user(self, db: Session):
        """Test authentication with non-existent user returns None."""
        result = AuthService.authenticate_user(
            db, 
            "nonexistent@test.example.com", 
            "anypassword"
        )
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
