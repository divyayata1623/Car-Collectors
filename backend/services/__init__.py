"""
Services package for CAR COLLECTORS e-commerce backend.
Contains business logic and authentication services.

Import services explicitly to avoid circular dependencies:
  from services.jwt_service import JWTTokenService
  from services.auth import AuthService
  from services.s3 import S3Service
"""

__all__ = [
    "AuthService",
    "JWTTokenService",
    "S3Service",
]
