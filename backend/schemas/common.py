"""
Common Pydantic schemas shared across the application.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class PaginationParams(BaseModel):
    """Schema for pagination query parameters."""
    page: int = Field(default=1, ge=1, description="Page number, must be >= 1")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page, max 100")

    @field_validator('page')
    @classmethod
    def validate_page_positive(cls, v: int) -> int:
        """Validate page is at least 1."""
        if v < 1:
            raise ValueError('Page must be at least 1')
        return v

    @field_validator('limit')
    @classmethod
    def validate_limit_range(cls, v: int) -> int:
        """Validate limit is between 1 and 100."""
        if v < 1:
            raise ValueError('Limit must be at least 1')
        if v > 100:
            raise ValueError('Limit cannot exceed 100')
        return v


class PaginationMeta(BaseModel):
    """Schema for pagination metadata in responses."""
    page: int
    limit: int
    total: int
    total_pages: int
