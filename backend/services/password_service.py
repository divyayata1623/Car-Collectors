"""
Password hashing service module.

Handles secure password hashing and verification using bcrypt with cost factor 12.
Provides deterministic hashing validation and constant-time comparison for security.
"""

from passlib.context import CryptContext
from typing import Optional
import re

# Initialize password context with bcrypt
# Cost factor 12 = 2^12 = 4096 iterations (recommended for security)
# This provides strong protection against brute-force attacks
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# Minimum password length requirement
MIN_PASSWORD_LENGTH = 8


class PasswordService:
    """
    Service for secure password hashing and verification.
    
    Uses bcrypt with cost factor 12 for production-grade security.
    Implements constant-time comparison to prevent timing attacks.
    """
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
        """
        Validate password meets minimum security requirements.
        
        Preconditions:
        - password is a string (may be empty)
        
        Postconditions:
        - Returns tuple (is_valid, error_message)
        - If valid, error_message is None
        - If invalid, error_message describes the issue
        
        Args:
            password: Plain text password to validate
            
        Returns:
            Tuple of (is_valid: bool, error_message: Optional[str])
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
        """
        Hash a password using bcrypt with cost factor 12.
        
        Preconditions:
        - password is a non-empty string
        - password length >= 8 characters
        - password length <= 128 characters
        
        Postconditions:
        - Returns bcrypt hash string exactly 60 characters long
        - Hash starts with "$2b$12$" (bcrypt identifier + cost factor)
        - Same input produces different hashes due to unique salt
        - Hash includes 22-character base64 salt in positions 7-28
        - Can be safely stored in VARCHAR(255) database column
        
        Loop Invariants: N/A (no explicit loops)
        
        Args:
            password: Plain text password to hash
            
        Returns:
            Hashed password string (60 characters, bcrypt format)
            
        Raises:
            ValueError: If password fails validation
        """
        # Validate password
        is_valid, error_message = PasswordService.validate_password_strength(password)
        if not is_valid:
            raise ValueError(error_message)
        
        # Hash with bcrypt
        # pwd_context.hash() automatically generates unique salt and applies cost factor
        hashed = pwd_context.hash(password)
        
        # Verify result is valid bcrypt format
        if not hashed.startswith("$2b$12$"):
            raise RuntimeError("Password hashing produced unexpected format")
        
        if len(hashed) != 60:
            raise RuntimeError(f"Password hash has unexpected length: {len(hashed)} (expected 60)")
        
        return hashed
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its bcrypt hash using constant-time comparison.
        
        Preconditions:
        - plain_password is a string (may be incorrect attempt)
        - hashed_password is a valid bcrypt hash string (60 characters starting with $2b$)
        
        Postconditions:
        - Returns True if and only if plain_password matches hashed_password
        - Returns False for incorrect password (no exception thrown)
        - Comparison uses constant-time algorithm to prevent timing attacks
        - Function never reveals whether password is "close" to correct value
        
        Loop Invariants: N/A (constant-time comparison handled by passlib)
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored bcrypt password hash
            
        Returns:
            True if password matches, False otherwise
        """
        if not plain_password or not hashed_password:
            return False
        
        try:
            # passlib.verify() implements constant-time comparison internally
            # It compares all characters even after finding a mismatch
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # If verification throws (malformed hash, etc.), return False
            # Do not expose the error type (timing attack prevention)
            return False
    
    @staticmethod
    def is_password_hash_format_valid(password_hash: str) -> bool:
        """
        Check if a password hash is in valid bcrypt format.
        
        Preconditions:
        - password_hash is a string (may not be valid hash)
        
        Postconditions:
        - Returns True if hash is valid bcrypt format
        - Returns False otherwise
        
        Args:
            password_hash: String to validate as bcrypt hash
            
        Returns:
            True if valid bcrypt format, False otherwise
        """
        if not isinstance(password_hash, str):
            return False
        
        # Check length (bcrypt hashes are exactly 60 characters)
        if len(password_hash) != 60:
            return False
        
        # Check prefix (bcrypt uses $2b$12$ format)
        if not password_hash.startswith("$2b$12$"):
            return False
        
        # Check character set (base64 characters + $ and digits)
        # Bcrypt uses: a-z, A-Z, 0-9, ., / and $ for separators
        valid_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./$")
        if not all(c in valid_chars for c in password_hash):
            return False
        
        return True
    
    @staticmethod
    def needs_rehash(password_hash: str) -> bool:
        """
        Check if a password hash should be rehashed with current settings.
        
        This is useful for gradually upgrading password hashes when security
        parameters change (e.g., increasing cost factor).
        
        Preconditions:
        - password_hash is a string
        
        Postconditions:
        - Returns True if hash should be updated
        - Returns False if hash meets current standards
        
        Args:
            password_hash: Password hash to check
            
        Returns:
            True if hash should be rehashed, False otherwise
        """
        if not PasswordService.is_password_hash_format_valid(password_hash):
            return True
        
        # Check if cost factor is current (should be 12)
        try:
            if not password_hash.startswith("$2b$12$"):
                return True
        except Exception:
            return True
        
        return False


# Module-level convenience functions for backward compatibility

def hash_password(password: str) -> str:
    """
    Convenience function: Hash password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password (60 characters)
        
    Raises:
        ValueError: If password fails validation
    """
    return PasswordService.hash_password(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Convenience function: Verify password against hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored password hash
        
    Returns:
        True if password matches, False otherwise
    """
    return PasswordService.verify_password(plain_password, hashed_password)
