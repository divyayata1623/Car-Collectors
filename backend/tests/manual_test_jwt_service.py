"""
Manual tests for JWT token service.

This test file doesn't require pytest and demonstrates core JWT functionality.
Run with: python tests/manual_test_jwt_service.py
"""

import sys
import os
from datetime import timedelta
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.jwt_service import JWTTokenService
from fastapi import HTTPException


def test_create_token_customer():
    """Test creating a token for a customer user."""
    print("\n✓ Test: Create token for customer")
    token = JWTTokenService.create_token(
        user_id="550e8400-e29b-41d4-a716-446655440000",
        email="customer@example.com",
        role="CUSTOMER"
    )
    assert isinstance(token, str), "Token should be a string"
    assert len(token) > 0, "Token should not be empty"
    assert token.count(".") == 2, "Token should have 3 parts (JWT format)"
    print(f"  ✓ Token created: {token[:50]}...")


def test_create_token_admin():
    """Test creating a token for an admin user."""
    print("\n✓ Test: Create token for admin")
    token = JWTTokenService.create_token(
        user_id="550e8400-e29b-41d4-a716-446655440001",
        email="admin@example.com",
        role="ADMIN"
    )
    assert isinstance(token, str), "Token should be a string"
    assert token.count(".") == 2, "Token should have 3 parts"
    print(f"  ✓ Admin token created: {token[:50]}...")


def test_create_token_invalid_role():
    """Test that creating a token with invalid role raises ValueError."""
    print("\n✓ Test: Invalid role raises ValueError")
    try:
        JWTTokenService.create_token(
            user_id="test-user",
            email="test@example.com",
            role="INVALID_ROLE"
        )
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Invalid role" in str(e)
        print(f"  ✓ ValueError raised correctly: {e}")


def test_decode_token():
    """Test successfully decoding a valid token."""
    print("\n✓ Test: Decode valid token")
    token = JWTTokenService.create_token(
        user_id="550e8400-e29b-41d4-a716-446655440000",
        email="test@example.com",
        role="CUSTOMER"
    )
    
    payload = JWTTokenService.decode_token(token)
    assert payload["sub"] == "550e8400-e29b-41d4-a716-446655440000"
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "CUSTOMER"
    assert "iat" in payload
    assert "exp" in payload
    print(f"  ✓ Token decoded successfully")
    print(f"    - User ID: {payload['sub']}")
    print(f"    - Email: {payload['email']}")
    print(f"    - Role: {payload['role']}")


def test_decode_token_invalid_signature():
    """Test that decoding a token with modified signature fails."""
    print("\n✓ Test: Invalid signature raises HTTPException")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
    )
    
    # Modify the token signature
    parts = token.split(".")
    modified_token = parts[0] + "." + parts[1] + ".invalid_signature"
    
    try:
        JWTTokenService.decode_token(modified_token)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 401
        print(f"  ✓ HTTPException raised: {e.detail}")


def test_decode_token_expired():
    """Test that decoding an expired token raises HTTPException."""
    print("\n✓ Test: Expired token raises HTTPException")
    # Create a token that expires immediately
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER",
        expires_delta=timedelta(seconds=-1)
    )
    
    try:
        JWTTokenService.decode_token(token)
        assert False, "Should have raised HTTPException"
    except HTTPException as e:
        assert e.status_code == 401
        print(f"  ✓ HTTPException raised: {e.detail}")


def test_verify_token_valid():
    """Test verify_token returns True for valid token."""
    print("\n✓ Test: verify_token returns True for valid token")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
    )
    
    result = JWTTokenService.verify_token(token)
    assert result is True
    print("  ✓ verify_token returned True")


def test_verify_token_expired():
    """Test verify_token returns False for expired token."""
    print("\n✓ Test: verify_token returns False for expired token")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER",
        expires_delta=timedelta(seconds=-1)
    )
    
    result = JWTTokenService.verify_token(token)
    assert result is False
    print("  ✓ verify_token returned False for expired token")


def test_verify_token_invalid():
    """Test verify_token returns False for invalid token."""
    print("\n✓ Test: verify_token returns False for invalid token")
    result = JWTTokenService.verify_token("invalid_token_string")
    assert result is False
    print("  ✓ verify_token returned False for invalid token")


def test_verify_token_empty():
    """Test verify_token returns False for empty token."""
    print("\n✓ Test: verify_token returns False for empty/None token")
    result = JWTTokenService.verify_token("")
    assert result is False
    
    result = JWTTokenService.verify_token(None)
    assert result is False
    print("  ✓ verify_token returned False for empty/None")


def test_get_user_id_from_token():
    """Test extracting user_id from token."""
    print("\n✓ Test: Extract user_id from token")
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = JWTTokenService.create_token(
        user_id=user_id,
        email="test@example.com",
        role="CUSTOMER"
    )
    
    extracted_id = JWTTokenService.get_user_id_from_token(token)
    assert extracted_id == user_id
    print(f"  ✓ User ID extracted: {extracted_id}")


def test_get_user_id_from_invalid_token():
    """Test extracting user_id from invalid token returns None."""
    print("\n✓ Test: Extract user_id from invalid token returns None")
    result = JWTTokenService.get_user_id_from_token("invalid_token")
    assert result is None
    print("  ✓ Returned None for invalid token")


def test_get_role_from_token():
    """Test extracting role from token."""
    print("\n✓ Test: Extract role from token")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="ADMIN"
    )
    
    role = JWTTokenService.get_role_from_token(token)
    assert role == "ADMIN"
    print(f"  ✓ Role extracted: {role}")


def test_token_expiration_default_7_days():
    """Test that token expiration is set to 7 days by default."""
    print("\n✓ Test: Token expiration is 7 days by default")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
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
    expected_seconds = 7 * 24 * 60 * 60  # 7 days in seconds
    
    # Allow 1 second margin for test execution time
    assert abs(diff_seconds - expected_seconds) <= 1
    print(f"  ✓ Expiration time verified: {diff_seconds} seconds (~7 days)")


def test_token_expiration_custom():
    """Test that token expiration can be customized."""
    print("\n✓ Test: Token expiration can be customized")
    custom_expiration = timedelta(days=1)
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER",
        expires_delta=custom_expiration
    )
    
    payload = JWTTokenService.decode_token(token)
    iat = payload["iat"]
    exp = payload["exp"]
    
    if isinstance(iat, int):
        iat = datetime.utcfromtimestamp(iat)
    if isinstance(exp, int):
        exp = datetime.utcfromtimestamp(exp)
    
    diff_seconds = (exp - iat).total_seconds()
    expected_seconds = 1 * 24 * 60 * 60  # 1 day in seconds
    
    assert abs(diff_seconds - expected_seconds) <= 1
    print(f"  ✓ Custom expiration verified: {diff_seconds} seconds (~1 day)")


def test_token_payload_structure():
    """Test that token payload has correct structure."""
    print("\n✓ Test: Token payload has correct structure")
    token = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
    )
    
    payload = JWTTokenService.decode_token(token)
    
    # Check all required fields are present
    required_fields = ["sub", "email", "role", "iat", "exp"]
    for field in required_fields:
        assert field in payload, f"Missing required field: {field}"
    
    print(f"  ✓ All required fields present: {', '.join(required_fields)}")


def test_create_multiple_tokens_different():
    """Test that creating multiple tokens produces different results."""
    print("\n✓ Test: Multiple tokens have different signatures")
    token1 = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
    )
    token2 = JWTTokenService.create_token(
        user_id="test-user",
        email="test@example.com",
        role="CUSTOMER"
    )
    
    # Tokens should be different due to different timestamps
    assert token1 != token2
    
    # Both should decode to same data
    payload1 = JWTTokenService.decode_token(token1)
    payload2 = JWTTokenService.decode_token(token2)
    
    assert payload1["sub"] == payload2["sub"]
    assert payload1["email"] == payload2["email"]
    assert payload1["role"] == payload2["role"]
    print("  ✓ Multiple tokens have different signatures but same payload")


def run_all_tests():
    """Run all manual tests."""
    print("=" * 60)
    print("JWT Token Service - Manual Test Suite")
    print("=" * 60)
    
    tests = [
        test_create_token_customer,
        test_create_token_admin,
        test_create_token_invalid_role,
        test_decode_token,
        test_decode_token_invalid_signature,
        test_decode_token_expired,
        test_verify_token_valid,
        test_verify_token_expired,
        test_verify_token_invalid,
        test_verify_token_empty,
        test_get_user_id_from_token,
        test_get_user_id_from_invalid_token,
        test_get_role_from_token,
        test_token_expiration_default_7_days,
        test_token_expiration_custom,
        test_token_payload_structure,
        test_create_multiple_tokens_different,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            failed += 1
            print(f"\n✗ FAILED: {e}")
        except Exception as e:
            failed += 1
            print(f"\n✗ ERROR: {e}")
    
    print("\n" + "=" * 60)
    print(f"Tests passed: {passed}/{len(tests)}")
    if failed > 0:
        print(f"Tests failed: {failed}")
        return 1
    else:
        print("All tests passed! ✓")
        return 0


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
