"""
Order routes for order creation and management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import math

from database import get_db
from dependencies.auth import get_current_user
from services.order import OrderService
from schemas.order import GuestOrderCreate, OrderCreate, OrderResponse, OrderListResponse
from schemas.common import PaginationMeta
from models.user import User
from models.shipping_setting import ShippingSetting
from schemas.shipping import ShippingSettingsResponse

router = APIRouter()


@router.get("/shipping", response_model=ShippingSettingsResponse)
async def get_shipping_settings(db: Session = Depends(get_db)):
    """Return public shipping rules used by cart and checkout."""
    settings = db.query(ShippingSetting).filter(ShippingSetting.id == 1).first()
    if not settings:
        return ShippingSettingsResponse(flat_fee=0, free_shipping_threshold=0)
    return settings


@router.post("/guest", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_guest_order(
    order_data: GuestOrderCreate,
    db: Session = Depends(get_db)
):
    """Create an order without requiring customer login credentials."""
    return OrderService.create_guest_order(db, order_data)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create order from cart items.
    """
    order = OrderService.create_order(db, str(current_user.id), order_data)
    return order


@router.get("", response_model=OrderListResponse)
async def get_user_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's orders.
    """
    orders, total = OrderService.get_user_orders(db, str(current_user.id), page, limit)
    
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    return OrderListResponse(
        orders=orders,
        pagination=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages
        )
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get single order by ID.
    """
    order = OrderService.get_order_by_id(db, order_id, str(current_user.id))
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order
