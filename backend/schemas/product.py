"""
Product-related Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator, PlainSerializer
from typing import Optional, List, Union, Annotated
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from schemas.common import PaginationMeta

UUIDStr = Annotated[Union[UUID, str], PlainSerializer(lambda x: str(x), return_type=str)]


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(..., min_length=1, max_length=255)
    brand: str = Field(..., min_length=1, max_length=100)
    series: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    category_id: Optional[str] = Field(None, description="Category UUID")
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0, description="Price must be >= 0")
    stock_quantity: int = Field(..., ge=0, description="Stock quantity must be >= 0")
    scale: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1800, le=2100)
    condition: Optional[str] = Field(None, max_length=100)
    material: Optional[str] = Field(None, max_length=100)
    front_package_image_url: str = Field(..., max_length=500)
    back_package_image_url: str = Field(..., max_length=500)

    @field_validator('price')
    @classmethod
    def validate_price_non_negative(cls, v: Decimal) -> Decimal:
        """Validate price is non-negative."""
        if v < 0:
            raise ValueError('Price must be greater than or equal to 0')
        return v

    @field_validator('stock_quantity')
    @classmethod
    def validate_stock_non_negative(cls, v: int) -> int:
        """Validate stock quantity is non-negative."""
        if v < 0:
            raise ValueError('Stock quantity must be greater than or equal to 0')
        return v


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    series: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    category_id: Optional[str] = Field(None, description="Category UUID")
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    scale: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1800, le=2100)
    condition: Optional[str] = Field(None, max_length=100)
    material: Optional[str] = Field(None, max_length=100)
    front_package_image_url: Optional[str] = Field(None, max_length=500)
    back_package_image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator('price')
    @classmethod
    def validate_price_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """Validate price is non-negative if provided."""
        if v is not None and v < 0:
            raise ValueError('Price must be greater than or equal to 0')
        return v

    @field_validator('stock_quantity')
    @classmethod
    def validate_stock_non_negative(cls, v: Optional[int]) -> Optional[int]:
        """Validate stock quantity is non-negative if provided."""
        if v is not None and v < 0:
            raise ValueError('Stock quantity must be greater than or equal to 0')
        return v


class CategoryInfo(BaseModel):
    """Nested schema for category information in product response."""
    id: UUIDStr
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    """Schema for product response."""
    id: UUIDStr
    name: str
    brand: str
    series: Optional[str] = None
    model: Optional[str] = None
    category: Optional[CategoryInfo] = None
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int
    scale: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None
    condition: Optional[str] = None
    material: Optional[str] = None
    front_package_image_url: str
    back_package_image_url: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """Schema for paginated product listing response."""
    products: List[ProductResponse]
    pagination: PaginationMeta