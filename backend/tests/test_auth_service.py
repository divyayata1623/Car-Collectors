"""
Unit tests for AuthService class.
Tests password hashing, JWT token generation/validation, and user authentication.
"""
import pytest
from datetime import timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from jose import jwt

from database import Base, get_db
from models.user import User
from schemas.user import UserCreate
from services.auth import AuthService, get_current_user, get_current_admin
import os

# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite:///./test_auth.db"

# Create test engine and session
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password_returns_60_char_bcrypt_hash(self):
        """Test that password hashing returns a valid bcrypt hash."""
        password = "testpassword123"
        hashed = AuthService.hash_password(password)
        
        # Bcrypt hashes are 60 characters and start with $2b$
        assert len(hashed) == 60
        assert hashed.startswith("$2b$")
    
    def test_verify_password_with_correct_password(self):
        """Test password verification with correct password."""
        password = "correctpassword"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(password, hashed) is True
    
    def test_verify_password_with_incorrect_password(self):
        """Test password verification with incorrect password."""
        password = "correctpassword"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password("wrongpassword", hashed) is False
    
    def test_different_hashes_for_same_password(self):
        """Test that same password generates different hashes (unique salts)."""
        password = "samepassword"
        hash1 = AuthService.hash_password(password)
        hash2 = AuthService.hash_password(password)
        
        # Hashes should be different due to unique salts
        assert hash1 != hash2
        # But both should verify correctly
        assert AuthService.verify_password(password, hash1) is True
        assert AuthService.verify_password(password, hash2) is True


class TestJWTTokenGeneration:
    """Test JWT token creation and decoding."""
    
    def test_create_access_token_with_default_expiration(self):
        """Test token creation with default 7-day expiration."""
        data = {"user_id": "123", "email": "test@example.com", "role": "CUSTOMER"}
        token = AuthService.create_access_token(data)
        
        # Token should be a non-empty string
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_custom_expiration(self):
        """Test token creation with custom expiration time."""
        data = {"user_id": "123", "email": "test@example.com", "role": "ADMIN"}
        expires_delta = timedelta(hours=1)
        token = AuthService.create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_token_with_valid_token(self):
        """Test decoding a valid JWT token."""
        data = {"user_id": "123", "email": "test@example.com", "role": "CUSTOMER"}
        token = AuthService.create_access_token(data)
        
        decoded = AuthService.decode_token(token)
        
        assert decoded["sub"] == "123"
        assert decoded["email"] == "test@example.com"
        assert decoded["role"] == "CUSTOMER"
        assert "exp" in decoded
        assert "iat" in decoded
    
    def test_decode_token_with_invalid_token(self):
        """Test that decoding invalid token raises HTTPException."""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            AuthService.decode_token("invalid.token.here")
        
        assert exc_info.value.status_code == 401
        assert "Invalid or expired token" in exc_info.value.detail


class TestUserCreation:
    """Test user creation and authentication."""
    
    def test_create_user_with_customer_role(self, db_session):
        """Test creating a new customer user."""
        user_data = UserCreate(
            email="customer@example.com",
            password="password123",
            full_name="Test Customer",
            mobile="1234567890"
        )
        
        user = AuthService.create_user(db_session, user_data, role="CUSTOMER")
        
        assert user.email == "customer@example.com"
        assert user.full_name == "Test Customer"
        assert user.mobile == "1234567890"
        assert user.role == "CUSTOMER"
        assert user.is_active is True
        assert len(user.password_hash) == 60
        assert user.password_hash.startswith("$2b$")
    
    def test_create_user_with_admin_role(self, db_session):
        """Test creating a new admin user."""
        user_data = UserCreate(
            email="admin@example.com",
            password="adminpass123",
            full_name="Test Admin"
        )
        
        user = AuthService.create_user(db_session, user_data, role="ADMIN")
        
        assert user.email == "admin@example.com"
        assert user.role == "ADMIN"
    
    def test_create_user_with_duplicate_email(self, db_session):
        """Test that duplicate email raises conflict error."""
        from fastapi import HTTPException
        
        user_data = UserCreate(
            email="duplicate@example.com",
            password="password123",
            full_name="First User"
        )
        
        # Create first user
        AuthService.create_user(db_session, user_data, role="CUSTOMER")
        
        # Try to create second user with same email
        user_data2 = UserCreate(
            email="duplicate@example.com",
            password="differentpass",
            full_name="Second User"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            AuthService.create_user(db_session, user_data2, role="CUSTOMER")
        
        assert exc_info.value.status_code == 409
        assert "Email already registered" in exc_info.value.detail


class TestUserAuthentication:
    """Test user authentication functionality."""
    
    def test_authenticate_user_with_valid_credentials(self, db_session):
        """Test authentication with correct email and password."""
        # Create a user
        user_data = UserCreate(
            email="auth@example.com",
            password="mypassword123",
            full_name="Auth User"
        )
        created_user = AuthService.create_user(db_session, user_data, role="CUSTOMER")
        
        # Authenticate
        authenticated_user = AuthService.authenticate_user(
            db_session, 
            "auth@example.com", 
            "mypassword123"
        )
        
        assert authenticated_user is not None
        assert authenticated_user.id == created_user.id
        assert authenticated_user.email == "auth@example.com"
    
    def test_authenticate_user_with_invalid_password(self, db_session):
        """Test authentication with incorrect password."""
        # Create a user
        user_data = UserCreate(
            email="auth2@example.com",
            password="correctpassword",
            full_name="Auth User 2"
        )
        AuthService.create_user(db_session, user_data, role="CUSTOMER")
        
        # Try to authenticate with wrong password
        authenticated_user = AuthService.authenticate_user(
            db_session, 
            "auth2@example.com", 
            "wrongpassword"
        )
        
        assert authenticated_user is None
    
    def test_authenticate_user_with_nonexistent_email(self, db_session):
        """Test authentication with non-existent email."""
        authenticated_user = AuthService.authenticate_user(
            db_session, 
            "nonexistent@example.com", 
            "anypassword"
        )
        
        assert authenticated_user is None


class TestPasswordRequirements:
    """Test password security requirements."""
    
    def test_bcrypt_cost_factor_12(self):
        """Test that bcrypt uses cost factor 12."""
        password = "testpassword"
        hashed = AuthService.hash_password(password)
        
        # Extract cost factor from hash (format: $2b$12$...)
        cost_factor = int(hashed.split("$")[2])
        assert cost_factor == 12
