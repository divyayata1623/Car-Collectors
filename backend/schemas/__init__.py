"""
Pydantic schemas for request/response validation.

This module provides all Pydantic schemas used for API input validation and 
response serialization across the CAR COLLECTORS e-commerce platform.
"""

# User schemas
from .user import (
    UserCreate,
    UserResponse,
    LoginRequest,
    LoginResponse,
)

# Product schemas
from .product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    CategoryInfo,
)

# Category schemas
from .category import (
    CategoryResponse,
)

# Cart schemas
from .cart import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
    ProductInCart,
)

# Order schemas
from .order import (
    OrderCreate,
    OrderResponse,
    OrderListResponse,
    DeliveryAddressCreate,
    DeliveryAddressResponse,
    OrderItemResponse,
    ProductInOrder,
)

# Common schemas
from .common import (
    PaginationParams,
    PaginationMeta,
)

__all__ = [
    # User
    "UserCreate",
    "UserResponse",
    "LoginRequest",
    "LoginResponse",
    
    # Product
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListResponse",
    "CategoryInfo",
    
    # Category
    "CategoryResponse",
    
    # Cart
    "CartItemCreate",
    "CartItemUpdate",
    "CartItemResponse",
    "CartResponse",
    "ProductInCart",
    
    # Order
    "OrderCreate",
    "OrderResponse",
    "OrderListResponse",
    "DeliveryAddressCreate",
    "DeliveryAddressResponse",
    "OrderItemResponse",
    "ProductInOrder",
    
    # Common
    "PaginationParams",
    "PaginationMeta",
]
