"""
Admin routes for product and order management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
import math

from database import get_db
from services.auth import get_current_admin
from services.s3 import s3_service
from services.order import OrderService
from repositories.product import ProductRepository
from schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from schemas.order import OrderResponse, OrderListResponse
from schemas.common import PaginationParams, PaginationMeta
from models.user import User

router = APIRouter()


# Product Management

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    brand: str = Form(...),
    category_id: str = Form(...),
    price: Decimal = Form(...),
    stock_quantity: int = Form(...),
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(...),
    series: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    scale: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create new product with image uploads (Admin only).
    """
    # Upload images to S3
    front_url, back_url = s3_service.upload_product_images(front_image, back_image)
    
    # Create product
    product_data = {
        "name": name,
        "brand": brand,
        "series": series,
        "model": model,
        "category_id": category_id,
        "description": description,
        "price": price,
        "stock_quantity": stock_quantity,
        "scale": scale,
        "material": material,
        "front_package_image_url": front_url,
        "back_package_image_url": back_url,
        "is_active": True
    }
    
    product = ProductRepository.create(db, product_data)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update product (Admin only).
    """
    product = ProductRepository.update(db, product_id, update_data.model_dump(exclude_unset=True))
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Soft delete product (Admin only).
    """
    deleted = ProductRepository.delete(db, product_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return None


# Order Management

@router.get("/orders", response_model=OrderListResponse)
async def get_all_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all orders with filtering (Admin only).
    """
    orders, total = OrderService.get_all_orders(db, page, limit, status)
    
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


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    new_status: str = Query(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update order status (Admin only).
    """
    order = OrderService.update_order_status(db, order_id, new_status)
    return order


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get order details (Admin only).
    """
    order = OrderService.get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order
