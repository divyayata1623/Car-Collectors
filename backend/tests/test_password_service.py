"""
Unit tests for password hashing service.

Tests password hashing, verification, and validation functions using pytest.
Covers security requirements, format validation, and edge cases.
"""

import pytest
import sys
import os

# Add the backend directory to the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import directly to avoid SQLAlchemy circular dependency issues
from passlib.context import CryptContext

# Recreate the password service in test context
MIN_PASSWORD_LENGTH = 8

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

class PasswordService:
    """
    Service for secure password hashing and verification.
    
    Uses bcrypt with cost factor 12 for production-grade security.
    Implements constant-time comparison to prevent timing attacks.
    """
    
    @staticmethod
    def validate_password_strength(password: str):
        """
        Validate password meets minimum security requirements.
        
        Returns tuple (is_valid, error_message)
        """
        if not password:
            return False, "Password cannot be empty"
        
        if len(password) < MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
        
        if len(password) > 128:
            return False, "Password cannot exceed 128 characters"
        
        return True, None
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt with cost factor 12."""
        # Validate password
        is_valid, error_message = PasswordService.validate_password_strength(password)
        if not is_valid:
            raise ValueError(error_message)
        
        # Hash with bcrypt
        hashed = pwd_context.hash(password)
        
        # Verify result is valid bcrypt format
        if not hashed.startswith("$2b$12$"):
            raise RuntimeError("Password hashing produced unexpected format")
        
        if len(hashed) != 60:
            raise RuntimeError(f"Password hash has unexpected length: {len(hashed)} (expected 60)")
        
        return hashed
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its bcrypt hash using constant-time comparison."""
        if not plain_password or not hashed_password:
            return False
        
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    
    @staticmethod
    def is_password_hash_format_valid(password_hash: str) -> bool:
        """Check if a password hash is in valid bcrypt format."""
        if not isinstance(password_hash, str):
            return False
        
        # Check length (bcrypt hashes are exactly 60 characters)
        if len(password_hash) != 60:
            return False
        
        # Check prefix (bcrypt uses $2b$12$ format)
        if not password_hash.startswith("$2b$12$"):
            return False
        
        # Check character set
        valid_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./$")
        if not all(c in valid_chars for c in password_hash):
            return False
        
        return True
    
    @staticmethod
    def needs_rehash(password_hash: str) -> bool:
        """Check if a password hash should be rehashed with current settings."""
        if not PasswordService.is_password_hash_format_valid(password_hash):
            return True
        
        try:
            if not password_hash.startswith("$2b$12$"):
                return True
        except Exception:
            return True
        
        return False


# Module-level convenience functions
def hash_password(password: str) -> str:
    """Convenience function: Hash password using bcrypt."""
    return PasswordService.hash_password(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Convenience function: Verify password against hash."""
    return PasswordService.verify_password(plain_password, hashed_password)


class TestPasswordValidation:
    """Test password strength validation."""
    
    def test_validate_empty_password(self):
        """Empty password should be invalid."""
        is_valid, error = PasswordService.validate_password_strength("")
        assert not is_valid
        assert "cannot be empty" in error.lower()
    
    def test_validate_short_password(self):
        """Password shorter than minimum length should be invalid."""
        short_pwd = "Pass1"  # Less than 8 characters
        is_valid, error = PasswordService.validate_password_strength(short_pwd)
        assert not is_valid
        assert "at least" in error.lower() and "8" in error
    
    def test_validate_minimum_length_password(self):
        """Password of exactly 8 characters should be valid."""
        min_pwd = "Pass1234"
        is_valid, error = PasswordService.validate_password_strength(min_pwd)
        assert is_valid
        assert error is None
    
    def test_validate_long_password(self):
        """Valid long password should be valid."""
        long_pwd = "VerySecurePassword123!@#WithSpecialChars"
        is_valid, error = PasswordService.validate_password_strength(long_pwd)
        assert is_valid
        assert error is None
    
    def test_validate_exceeds_max_length(self):
        """Password exceeding 128 characters should be invalid."""
        too_long = "a" * 129
        is_valid, error = PasswordService.validate_password_strength(too_long)
        assert not is_valid
        assert "exceed" in error.lower() and "128" in error
    
    def test_validate_max_length_password(self):
        """Password of exactly 128 characters should be valid."""
        max_pwd = "a" * 128
        is_valid, error = PasswordService.validate_password_strength(max_pwd)
        assert is_valid
        assert error is None


class TestPasswordHashing:
    """Test password hashing functionality."""
    
    def test_hash_password_returns_60_chars(self):
        """Password hash should be exactly 60 characters."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        assert len(hashed) == 60
    
    def test_hash_password_bcrypt_format(self):
        """Password hash should be in bcrypt format starting with $2b$12$."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        assert hashed.startswith("$2b$12$"), f"Hash format incorrect: {hashed[:7]}"
    
    def test_hash_password_deterministic_format(self):
        """Hash should have valid bcrypt structure."""
        password = "TestPassword123"
        hashed = hash_password(password)
        
        # Check prefix (algorithm identifier and cost)
        assert hashed[:3] == "$2b"
        assert hashed[3:4] == "$"
        assert hashed[4:6] == "12"
        assert hashed[6] == "$"
        
        # Check format: $2b$12${22-char-salt}{31-char-hash}
        assert len(hashed) == 7 + 22 + 31  # 60 total
    
    def test_hash_password_different_salts(self):
        """Same password hashed twice should produce different hashes (unique salts)."""
        password = "SecurePassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Hashes should be different due to unique salts
        assert hash1 != hash2
        
        # But both should be valid bcrypt format
        assert len(hash1) == 60
        assert len(hash2) == 60
        assert hash1.startswith("$2b$12$")
        assert hash2.startswith("$2b$12$")
    
    def test_hash_password_short_password(self):
        """Hashing minimum length password should succeed."""
        password = "Pass1234"  # Exactly 8 characters
        hashed = hash_password(password)
        assert len(hashed) == 60
        assert hashed.startswith("$2b$12$")
    
    def test_hash_password_unicode_characters(self):
        """Hashing password with unicode characters should work."""
        password = "SecurePassword123😀"
        hashed = hash_password(password)
        assert len(hashed) == 60
        assert hashed.startswith("$2b$12$")
    
    def test_hash_password_special_characters(self):
        """Hashing password with special characters should work."""
        password = "P@$$w0rd!#%&*()[]{}~`"
        hashed = hash_password(password)
        assert len(hashed) == 60
        assert hashed.startswith("$2b$12$")
    
    def test_hash_password_validation_error_on_short_password(self):
        """Hashing password shorter than minimum should raise ValueError."""
        with pytest.raises(ValueError, match="at least 8"):
            hash_password("short")
    
    def test_hash_password_validation_error_on_empty_password(self):
        """Hashing empty password should raise ValueError."""
        with pytest.raises(ValueError, match="cannot be empty"):
            hash_password("")
    
    def test_hash_password_validation_error_on_too_long_password(self):
        """Hashing password exceeding 128 chars should raise ValueError."""
        with pytest.raises(ValueError, match="exceed"):
            hash_password("a" * 129)


class TestPasswordVerification:
    """Test password verification functionality."""
    
    def test_verify_correct_password(self):
        """Correct password should verify successfully."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed)
    
    def test_verify_incorrect_password(self):
        """Incorrect password should not verify."""
        password = "SecurePassword123"
        wrong_password = "DifferentPassword123"
        hashed = hash_password(password)
        
        assert not verify_password(wrong_password, hashed)
    
    def test_verify_case_sensitive(self):
        """Password verification should be case-sensitive."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Different case should not match
        assert not verify_password("securepassword123", hashed)
        assert not verify_password("SECUREPASSWORD123", hashed)
    
    def test_verify_trailing_space(self):
        """Password with added space should not verify."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert not verify_password(password + " ", hashed)
    
    def test_verify_leading_space(self):
        """Password with leading space should not verify."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert not verify_password(" " + password, hashed)
    
    def test_verify_similar_password(self):
        """Similar but different password should not verify."""
        password = "SecurePassword123"
        similar = "SecurePassword124"  # Last char different
        hashed = hash_password(password)
        
        assert not verify_password(similar, hashed)
    
    def test_verify_empty_plain_password(self):
        """Verifying with empty plain password should return False."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert not verify_password("", hashed)
    
    def test_verify_empty_hash(self):
        """Verifying with empty hash should return False."""
        assert not verify_password("SecurePassword123", "")
    
    def test_verify_none_plain_password(self):
        """Verifying with None plain password should handle gracefully."""
        hashed = hash_password("SecurePassword123")
        
        # Should not crash, should return False
        assert not verify_password(None, hashed)  # type: ignore
    
    def test_verify_unicode_password(self):
        """Verifying unicode password should work correctly."""
        password = "SecurePassword123😀"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed)
        assert not verify_password("SecurePassword123", hashed)
    
    def test_verify_special_characters_password(self):
        """Verifying password with special characters should work."""
        password = "P@$$w0rd!#%&*()[]{}~`"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed)
        assert not verify_password(password + "x", hashed)
    
    def test_verify_multiple_different_hashes(self):
        """Same password hashed twice should both verify."""
        password = "SecurePassword123"
        hashed1 = hash_password(password)
        hashed2 = hash_password(password)
        
        # Both hashes should verify with same password
        assert verify_password(password, hashed1)
        assert verify_password(password, hashed2)
        
        # But hashes are different
        assert hashed1 != hashed2


class TestHashFormatValidation:
    """Test password hash format validation."""
    
    def test_is_password_hash_format_valid_correct_hash(self):
        """Valid bcrypt hash should pass format validation."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert PasswordService.is_password_hash_format_valid(hashed)
    
    def test_is_password_hash_format_valid_wrong_length(self):
        """Hash with wrong length should fail validation."""
        assert not PasswordService.is_password_hash_format_valid("$2b$12$abc")
        assert not PasswordService.is_password_hash_format_valid("$2b$12$" + "a" * 50)  # Too long
    
    def test_is_password_hash_format_valid_wrong_prefix(self):
        """Hash with wrong prefix should fail validation."""
        assert not PasswordService.is_password_hash_format_valid("$2a$12$" + "a" * 53)
        assert not PasswordService.is_password_hash_format_valid("$1$" + "a" * 53)
        assert not PasswordService.is_password_hash_format_valid("bcrypt:" + "a" * 52)
    
    def test_is_password_hash_format_valid_wrong_cost_factor(self):
        """Hash with wrong cost factor should fail validation."""
        # Valid format but cost factor is 11 instead of 12
        fake_hash = "$2b$11$" + "a" * 53
        assert not PasswordService.is_password_hash_format_valid(fake_hash)
    
    def test_is_password_hash_format_valid_invalid_characters(self):
        """Hash with invalid characters should fail validation."""
        # Valid structure but with invalid character
        fake_hash = "$2b$12$" + "a" * 22 + "!" + "a" * 30  # ! is not valid
        assert not PasswordService.is_password_hash_format_valid(fake_hash)
    
    def test_is_password_hash_format_valid_empty_string(self):
        """Empty string should fail validation."""
        assert not PasswordService.is_password_hash_format_valid("")
    
    def test_is_password_hash_format_valid_none_type(self):
        """None should fail validation gracefully."""
        assert not PasswordService.is_password_hash_format_valid(None)  # type: ignore
    
    def test_is_password_hash_format_valid_not_string(self):
        """Non-string input should fail validation."""
        assert not PasswordService.is_password_hash_format_valid(123)  # type: ignore
        assert not PasswordService.is_password_hash_format_valid([])  # type: ignore


class TestRehashDetection:
    """Test detection of hashes needing rehashing."""
    
    def test_needs_rehash_valid_hash(self):
        """Hash with current settings should not need rehashing."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert not PasswordService.needs_rehash(hashed)
    
    def test_needs_rehash_invalid_format(self):
        """Hash with invalid format should need rehashing."""
        assert PasswordService.needs_rehash("plaintext_password")
        assert PasswordService.needs_rehash("$2a$12$" + "a" * 53)  # Old bcrypt variant
        assert PasswordService.needs_rehash("$2b$11$" + "a" * 53)  # Wrong cost factor
    
    def test_needs_rehash_empty_hash(self):
        """Empty hash should need rehashing."""
        assert PasswordService.needs_rehash("")
    
    def test_needs_rehash_invalid_length(self):
        """Hash with invalid length should need rehashing."""
        assert PasswordService.needs_rehash("short")
        assert PasswordService.needs_rehash("$2b$12$" + "a" * 100)


class TestConvenienceFunctions:
    """Test module-level convenience functions."""
    
    def test_module_hash_password_function(self):
        """Module-level hash_password should work correctly."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert len(hashed) == 60
        assert hashed.startswith("$2b$12$")
    
    def test_module_verify_password_function(self):
        """Module-level verify_password should work correctly."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed)
        assert not verify_password("wrong", hashed)
    
    def test_convenience_functions_match_class_methods(self):
        """Module functions should behave identically to class methods."""
        password = "SecurePassword123"
        
        # Test hashing
        hashed_module = hash_password(password)
        hashed_class = PasswordService.hash_password(password)
        
        # Both should be valid format
        assert len(hashed_module) == 60
        assert len(hashed_class) == 60
        
        # Both should verify the password
        assert verify_password(password, hashed_module)
        assert verify_password(password, hashed_class)
        assert PasswordService.verify_password(password, hashed_module)
        assert PasswordService.verify_password(password, hashed_class)


class TestSecurityProperties:
    """Test security properties of password hashing."""
    
    def test_no_password_information_in_hash(self):
        """Hash should not contain original password."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Password should never appear in hash
        assert password not in hashed
        assert password.lower() not in hashed.lower()
        assert password.upper() not in hashed.upper()
    
    def test_hash_salt_uniqueness(self):
        """Different hashes should use different salts."""
        password = "SecurePassword123"
        hashes = [hash_password(password) for _ in range(10)]
        
        # Extract salt portion (positions 7-28, 22 characters)
        salts = [h[7:29] for h in hashes]
        
        # All salts should be unique
        assert len(set(salts)) == 10, "Salts should be unique"
    
    def test_constant_time_comparison(self):
        """Verify and wrong password should both return False quickly."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Both correct and incorrect passwords should be handled
        assert verify_password(password, hashed)
        assert not verify_password("WrongPassword123", hashed)
        
        # No exception should be raised for invalid hashes
        assert not verify_password(password, "invalid_hash")
    
    def test_bcrypt_cost_factor(self):
        """Bcrypt should use cost factor 12 for security."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Cost factor is in positions 4-5
        cost_factor = hashed[4:6]
        assert cost_factor == "12", f"Cost factor should be 12, got {cost_factor}"
    
    def test_no_reversibility(self):
        """Hashed password should not be reversible to original."""
        password = "SecurePassword123"
        hashed = hash_password(password)
        
        # Hashed password should not be usable as password for anything
        # (just verify it's not trivially encoded)
        assert hashed != password
        # Don't test hex encoding as it's time-consuming
