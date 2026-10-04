"""
Unit tests for JWT token service.

Tests cover:
- Token creation with various user data
- Token decoding and validation
- Expiration handling
- Invalid token rejection
- Token signature verification
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from fastapi import HTTPException, status
from services.jwt_service import JWTTokenService
import os


class TestJWTTokenService:
    """Test suite for JWTTokenService class."""
    
    @pytest.fixture
    def valid_token_data(self):
        """Fixture providing valid token data for tests."""
        return {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "test@example.com",
            "role": "CUSTOMER"
        }
    
    @pytest.fixture
    def admin_token_data(self):
        """Fixture providing admin token data for tests."""
        return {
            "user_id": "550e8400-e29b-41d4-a716-446655440001",
            "email": "admin@example.com",
            "role": "ADMIN"
        }
    
    def test_create_token_customer(self, valid_token_data):
        """Test creating a token for a customer user."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        # Token should be a string
        assert isinstance(token, str)
        
        # Token should not be empty
        assert len(token) > 0
        
        # Token should have JWT structure (3 parts separated by dots)
        parts = token.split(".")
        assert len(parts) == 3
    
    def test_create_token_admin(self, admin_token_data):
        """Test creating a token for an admin user."""
        token = JWTTokenService.create_token(**admin_token_data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        parts = token.split(".")
        assert len(parts) == 3
    
    def test_create_token_invalid_role(self, valid_token_data):
        """Test that creating a token with invalid role raises ValueError."""
        invalid_data = valid_token_data.copy()
        invalid_data["role"] = "INVALID_ROLE"
        
        with pytest.raises(ValueError, match="Invalid role"):
            JWTTokenService.create_token(**invalid_data)
    
    def test_decode_token_success(self, valid_token_data):
        """Test successfully decoding a valid token."""
        token = JWTTokenService.create_token(**valid_token_data)
        payload = JWTTokenService.decode_token(token)
        
        # Verify payload contains expected claims
        assert payload["sub"] == valid_token_data["user_id"]
        assert payload["email"] == valid_token_data["email"]
        assert payload["role"] == valid_token_data["role"]
        assert "iat" in payload
        assert "exp" in payload
    
    def test_decode_token_contains_timestamps(self, valid_token_data):
        """Test that decoded token includes iat and exp timestamps."""
        token = JWTTokenService.create_token(**valid_token_data)
        payload = JWTTokenService.decode_token(token)
        
        # Both timestamps should be present
        assert "iat" in payload
        assert "exp" in payload
        
        # Both should be integers (Unix timestamps)
        assert isinstance(payload["iat"], (int, datetime))
        assert isinstance(payload["exp"], (int, datetime))
    
    def test_decode_token_invalid_signature(self, valid_token_data):
        """Test that decoding a token with modified signature fails."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        # Modify the token signature
        parts = token.split(".")
        modified_token = parts[0] + "." + parts[1] + ".invalid_signature"
        
        with pytest.raises(HTTPException) as exc_info:
            JWTTokenService.decode_token(modified_token)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid or expired token" in exc_info.value.detail
    
    def test_decode_token_expired(self, valid_token_data):
        """Test that decoding an expired token raises HTTPException."""
        # Create a token that expires immediately
        expired_token = JWTTokenService.create_token(
            **valid_token_data,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        
        with pytest.raises(HTTPException) as exc_info:
            JWTTokenService.decode_token(expired_token)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_decode_token_malformed(self):
        """Test that decoding a malformed token raises HTTPException."""
        malformed_tokens = [
            "not.a.token",  # Wrong format but still 3 parts
            "onlyonepart",
            "two.parts",
            "invalid...",
            ""
        ]
        
        for malformed_token in malformed_tokens:
            with pytest.raises(HTTPException) as exc_info:
                JWTTokenService.decode_token(malformed_token)
            
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_verify_token_valid(self, valid_token_data):
        """Test verify_token returns True for valid token."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        result = JWTTokenService.verify_token(token)
        assert result is True
    
    def test_verify_token_expired(self, valid_token_data):
        """Test verify_token returns False for expired token."""
        expired_token = JWTTokenService.create_token(
            **valid_token_data,
            expires_delta=timedelta(seconds=-1)
        )
        
        result = JWTTokenService.verify_token(expired_token)
        assert result is False
    
    def test_verify_token_invalid(self):
        """Test verify_token returns False for invalid token."""
        result = JWTTokenService.verify_token("invalid_token_string")
        assert result is False
    
    def test_verify_token_empty(self):
        """Test verify_token returns False for empty token."""
        result = JWTTokenService.verify_token("")
        assert result is False
    
    def test_verify_token_none(self):
        """Test verify_token returns False for None token."""
        result = JWTTokenService.verify_token(None)
        assert result is False
    
    def test_get_user_id_from_token(self, valid_token_data):
        """Test extracting user_id from token."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        user_id = JWTTokenService.get_user_id_from_token(token)
        assert user_id == valid_token_data["user_id"]
    
    def test_get_user_id_from_expired_token(self, valid_token_data):
        """Test extracting user_id from expired token (should still work)."""
        expired_token = JWTTokenService.create_token(
            **valid_token_data,
            expires_delta=timedelta(seconds=-1)
        )
        
        user_id = JWTTokenService.get_user_id_from_token(expired_token)
        assert user_id == valid_token_data["user_id"]
    
    def test_get_user_id_from_invalid_token(self):
        """Test extracting user_id from invalid token returns None."""
        user_id = JWTTokenService.get_user_id_from_token("invalid_token")
        assert user_id is None
    
    def test_get_role_from_token_customer(self, valid_token_data):
        """Test extracting role from customer token."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        role = JWTTokenService.get_role_from_token(token)
        assert role == "CUSTOMER"
    
    def test_get_role_from_token_admin(self, admin_token_data):
        """Test extracting role from admin token."""
        token = JWTTokenService.create_token(**admin_token_data)
        
        role = JWTTokenService.get_role_from_token(token)
        assert role == "ADMIN"
    
    def test_get_role_from_invalid_token(self):
        """Test extracting role from invalid token returns None."""
        role = JWTTokenService.get_role_from_token("invalid_token")
        assert role is None
    
    def test_token_expiration_default_7_days(self, valid_token_data):
        """Test that token expiration is set to 7 days by default."""
        token = JWTTokenService.create_token(**valid_token_data)
        payload = JWTTokenService.decode_token(token)
        
        # Calculate approximate expected expiration time
        iat = payload["iat"]
        exp = payload["exp"]
        
        # Convert to datetime if needed
        if isinstance(iat, int):
            iat = datetime.utcfromtimestamp(iat)
        if isinstance(exp, int):
            exp = datetime.utcfromtimestamp(exp)
        
        # Calculate difference
        diff_seconds = (exp - iat).total_seconds()
        expected_seconds = 7 * 24 * 60 * 60  # 7 days in seconds
        
        # Allow 1 second margin for test execution time
        assert abs(diff_seconds - expected_seconds) <= 1
    
    def test_token_expiration_custom(self, valid_token_data):
        """Test that token expiration can be customized."""
        custom_expiration = timedelta(days=1)
        token = JWTTokenService.create_token(
            **valid_token_data,
            expires_delta=custom_expiration
        )
        
        payload = JWTTokenService.decode_token(token)
        iat = payload["iat"]
        exp = payload["exp"]
        
        # Convert to datetime if needed
        if isinstance(iat, int):
            iat = datetime.utcfromtimestamp(iat)
        if isinstance(exp, int):
            exp = datetime.utcfromtimestamp(exp)
        
        # Calculate difference
        diff_seconds = (exp - iat).total_seconds()
        expected_seconds = 1 * 24 * 60 * 60  # 1 day in seconds
        
        # Allow 1 second margin
        assert abs(diff_seconds - expected_seconds) <= 1
    
    def test_token_algorithm_hs256(self, valid_token_data):
        """Test that token is signed with HS256 algorithm."""
        token = JWTTokenService.create_token(**valid_token_data)
        
        # Decode header to check algorithm
        parts = token.split(".")
        
        # Decode header (first part) - it's base64url encoded
        import base64
        import json
        
        # Add padding if needed
        header_b64 = parts[0]
        padding = 4 - len(header_b64) % 4
        if padding != 4:
            header_b64 += "=" * padding
        
        header = json.loads(base64.urlsafe_b64decode(header_b64))
        assert header["alg"] == "HS256"
    
    def test_token_payload_structure(self, valid_token_data):
        """Test that token payload has correct structure."""
        token = JWTTokenService.create_token(**valid_token_data)
        payload = JWTTokenService.decode_token(token)
        
        # Check all required fields are present
        required_fields = ["sub", "email", "role", "iat", "exp"]
        for field in required_fields:
            assert field in payload, f"Missing required field: {field}"
    
    def test_create_multiple_tokens_different_signatures(self, valid_token_data):
        """Test that creating multiple tokens produces different signatures."""
        token1 = JWTTokenService.create_token(**valid_token_data)
        token2 = JWTTokenService.create_token(**valid_token_data)
        
        # Tokens should be different due to different timestamps
        assert token1 != token2
        
        # Both should still decode successfully to same data
        payload1 = JWTTokenService.decode_token(token1)
        payload2 = JWTTokenService.decode_token(token2)
        
        assert payload1["sub"] == payload2["sub"]
        assert payload1["email"] == payload2["email"]
        assert payload1["role"] == payload2["role"]
    
    def test_decode_token_missing_claims(self, valid_token_data):
        """Test that token missing required claims raises HTTPException."""
        # Create a token without role
        minimal_payload = {
            "sub": valid_token_data["user_id"],
            "email": valid_token_data["email"]
        }
        
        # Manually encode without role
        token = jwt.encode(
            minimal_payload,
            JWTTokenService.SECRET_KEY,
            algorithm=JWTTokenService.ALGORITHM
        )
        
        with pytest.raises(HTTPException) as exc_info:
            JWTTokenService.decode_token(token)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "missing required claims" in exc_info.value.detail
