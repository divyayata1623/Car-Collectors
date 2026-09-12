"""
Cart-related Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime
from decimal import Decimal


class CartItemCreate(BaseModel):
    """Schema for adding item to cart."""
    product_id: str = Field(..., description="Product UUID")
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")

    @field_validator('quantity')
    @classmethod
    def validate_quantity_positive(cls, v: int) -> int:
        """Validate quantity is positive."""
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")

    @field_validator('quantity')
    @classmethod
    def validate_quantity_positive(cls, v: int) -> int:
        """Validate quantity is positive."""
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class ProductInCart(BaseModel):
    """Nested schema for product information in cart item."""
    id: str
    name: str
    brand: str
    price: Decimal
    stock_quantity: int
    front_package_image_url: str

    model_config = {"from_attributes": True}


class CartItemResponse(BaseModel):
    """Schema for cart item response."""
    id: str
    product: ProductInCart
    quantity: int
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    """Schema for cart response with items and total."""
    items: List[CartItemResponse]
    total: Decimal
