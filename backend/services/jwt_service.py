"""
JWT Token Service for generating and validating JWT tokens.

This module handles all JWT token operations including:
- Token generation with user claims
- Token validation and decoding
- Error handling for expired/invalid tokens
- Integration with environment configuration
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
import os
from jose import JWTError, jwt
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()


class JWTTokenService:
    """
    Service for handling JWT token generation, validation, and decoding.
    
    Uses HS256 (HMAC-SHA256) algorithm for signing tokens with a secret key.
    Tokens include user_id (sub), email, and role in the payload.
    Default expiration is 7 days from issuance.
    """
    
    # JWT configuration from environment variables
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
    
    # Validate SECRET_KEY is properly configured
    if not SECRET_KEY or len(SECRET_KEY) < 32 or SECRET_KEY.lower().startswith(
        ("your_", "replace_", "change_")
    ):
        raise RuntimeError(
            "SECRET_KEY must be a non-placeholder value of at least 32 characters. "
            "Please configure it in your .env file or environment variables."
        )
    
    @classmethod
    def create_token(
        cls,
        user_id: str,
        email: str,
        role: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Generate JWT access token with user claims.
        
        Creates a JWT token with the following payload:
        - sub: user_id (subject - the entity the JWT is about)
        - email: user's email address
        - role: user's role (ADMIN or CUSTOMER)
        - iat: issued at timestamp (UTC)
        - exp: expiration timestamp (UTC)
        
        Preconditions:
        - user_id is a valid UUID string
        - email is a valid email address
        - role is either 'ADMIN' or 'CUSTOMER'
        - SECRET_KEY is properly configured (minimum 32 characters)
        
        Postconditions:
        - Returns a valid JWT token string
        - Token is signed with HS256 algorithm
        - Token includes all required claims
        - Token expiration can be customized or defaults to 7 days
        
        Args:
            user_id: User's UUID as string
            email: User's email address
            role: User's role ('ADMIN' or 'CUSTOMER')
            expires_delta: Optional custom expiration time. If None, defaults to 7 days.
            
        Returns:
            Encoded JWT token string (can be included in Authorization header as "Bearer <token>")
            
        Raises:
            ValueError: If role is not 'ADMIN' or 'CUSTOMER'
        """
        # Validate role
        if role not in ("ADMIN", "CUSTOMER"):
            raise ValueError(f"Invalid role: {role}. Must be 'ADMIN' or 'CUSTOMER'.")
        
        # Calculate expiration time
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=cls.ACCESS_TOKEN_EXPIRE_DAYS)
        
        # Build token payload
        payload = {
            "sub": str(user_id),      # Subject: user ID
            "email": email,            # User's email
            "role": role,              # User's role
            "iat": datetime.utcnow(),  # Issued at
            "exp": expire              # Expiration
        }
        
        # Sign and encode token with HS256 algorithm
        encoded_jwt = jwt.encode(
            payload,
            cls.SECRET_KEY,
            algorithm=cls.ALGORITHM
        )
        
        return encoded_jwt
    
    @classmethod
    def decode_token(cls, token: str) -> Dict:
        """
        Decode and validate JWT token.
        
        Verifies the JWT signature and checks expiration. Returns the decoded payload
        containing user_id (sub), email, and role.
        
        Preconditions:
        - token is a non-empty string
        - token is a valid JWT format
        - SECRET_KEY matches the key used to sign the token
        
        Postconditions:
        - If successful, returns decoded payload dictionary
        - If token is expired, raises HTTPException with 401 status
        - If token signature is invalid, raises HTTPException with 401 status
        - If token format is invalid, raises HTTPException with 401 status
        
        Args:
            token: JWT token string (typically from Authorization header)
            
        Returns:
            Decoded token payload dictionary containing:
            - sub: user_id
            - email: user's email
            - role: user's role
            - iat: issued at timestamp
            - exp: expiration timestamp
            
        Raises:
            HTTPException: 401 Unauthorized if token is invalid, expired, or malformed
        """
        try:
            # Decode and validate token signature
            # JWT library automatically validates expiration time
            payload = jwt.decode(
                token,
                cls.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            
            # Verify required claims are present
            if "sub" not in payload or "email" not in payload or "role" not in payload:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing required claims",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            return payload
            
        except JWTError as e:
            # JWTError covers: expired tokens, invalid signatures, malformed tokens
            error_detail = "Invalid or expired token"
            
            # Provide more specific error message for debugging (in development)
            if str(e).startswith("Signature has expired"):
                error_detail = "Token has expired"
            elif str(e).startswith("Token is not yet valid"):
                error_detail = "Token not yet valid"
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_detail,
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    @classmethod
    def verify_token(cls, token: str) -> bool:
        """
        Verify if a token is valid without raising exceptions.
        
        Useful for conditional logic where you want to check token validity
        without handling HTTPException.
        
        Preconditions:
        - token is a string (may be None, empty, or invalid)
        
        Postconditions:
        - Returns True only if token is valid and not expired
        - Returns False for any invalid token (expired, malformed, etc.)
        
        Args:
            token: JWT token string to verify
            
        Returns:
            True if token is valid and not expired, False otherwise
        """
        if not token:
            return False
        
        try:
            jwt.decode(
                token,
                cls.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            return True
        except JWTError:
            return False
    
    @classmethod
    def get_user_id_from_token(cls, token: str) -> Optional[str]:
        """
        Extract user_id from token without full validation.
        
        Useful for getting user_id from token without the full decode verification.
        Use with caution - only use after token has been verified elsewhere.
        
        Preconditions:
        - token is a valid JWT string (should be verified separately)
        
        Postconditions:
        - Returns user_id string if present in token payload
        - Returns None if token cannot be decoded or user_id is missing
        
        Args:
            token: JWT token string
            
        Returns:
            User ID from token payload, or None if not found
        """
        try:
            payload = jwt.decode(
                token,
                cls.SECRET_KEY,
                algorithms=[cls.ALGORITHM],
                options={"verify_exp": False}  # Don't verify expiration for this check
            )
            return payload.get("sub")
        except JWTError:
            return None
    
    @classmethod
    def get_role_from_token(cls, token: str) -> Optional[str]:
        """
        Extract role from token without full validation.
        
        Similar to get_user_id_from_token, this is useful for quick role checks
        when token has already been verified.
        
        Preconditions:
        - token is a valid JWT string
        
        Postconditions:
        - Returns role ('ADMIN' or 'CUSTOMER') if present in token
        - Returns None if token cannot be decoded or role is missing
        
        Args:
            token: JWT token string
            
        Returns:
            Role from token payload, or None if not found
        """
        try:
            payload = jwt.decode(
                token,
                cls.SECRET_KEY,
                algorithms=[cls.ALGORITHM],
                options={"verify_exp": False}
            )
            return payload.get("role")
        except JWTError:
            return None
