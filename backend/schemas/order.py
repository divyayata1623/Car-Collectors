"""
Order-related Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from schemas.common import PaginationMeta

if TYPE_CHECKING:
    from schemas.common import PaginationMeta


class DeliveryAddressCreate(BaseModel):
    """Schema for delivery address in order creation."""
    full_name: str = Field(..., min_length=1, max_length=255)
    mobile: str = Field(..., min_length=1, max_length=20)
    address_line: str = Field(..., min_length=1, description="Complete street address")
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=1, max_length=10)


class OrderCreate(BaseModel):
    """Schema for creating a new order from cart."""
    delivery_address: DeliveryAddressCreate


class GuestOrderItemCreate(BaseModel):
    """A product and quantity submitted by an anonymous customer."""
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)


class GuestOrderCreate(BaseModel):
    """Guest checkout payload without account credentials."""
    delivery_address: DeliveryAddressCreate
    items: List[GuestOrderItemCreate] = Field(..., min_length=1)


class DeliveryAddressResponse(BaseModel):
    """Schema for delivery address response."""
    id: UUID
    full_name: str
    mobile: str
    address_line: str
    city: str
    state: str
    pincode: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductInOrder(BaseModel):
    """Nested schema for product information in order item."""
    id: UUID
    name: str
    brand: str

    model_config = {"from_attributes": True}


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    id: UUID
    product: ProductInOrder
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: UUID
    order_number: str
    user_id: UUID
    status: str
    total_amount: Decimal
    # The ORM relationship is named ``order_items``; keep the public API
    # contract as ``items`` for the frontend.
    items: List[OrderItemResponse] = Field(validation_alias='order_items')
    delivery_address: DeliveryAddressResponse
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Schema for paginated order listing response."""
    orders: List[OrderResponse]
    pagination: PaginationMeta
