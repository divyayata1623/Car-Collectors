"""
Admin routes for product and order management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
import math

from database import get_db
from dependencies.auth import get_current_admin
from services.s3 import s3_service
from services.order import OrderService
from repositories.product import ProductRepository
from schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from schemas.order import OrderResponse, OrderListResponse
from schemas.common import PaginationParams, PaginationMeta
from models.user import User
from models.shipping_setting import ShippingSetting
from schemas.shipping import ShippingSettingsResponse, ShippingSettingsUpdate

router = APIRouter()


@router.get("/shipping", response_model=ShippingSettingsResponse)
async def get_admin_shipping_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    settings = db.query(ShippingSetting).filter(ShippingSetting.id == 1).first()
    if not settings:
        settings = ShippingSetting(id=1, flat_fee=0, free_shipping_threshold=0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/shipping", response_model=ShippingSettingsResponse)
async def update_admin_shipping_settings(
    settings_data: ShippingSettingsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    settings = db.query(ShippingSetting).filter(ShippingSetting.id == 1).first()
    if not settings:
        settings = ShippingSetting(id=1)
        db.add(settings)
    settings.flat_fee = settings_data.flat_fee
    settings.free_shipping_threshold = settings_data.free_shipping_threshold
    db.commit()
    db.refresh(settings)
    return settings


# Product Management

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    brand: str = Form(...),
    price: Decimal = Form(...),
    stock_quantity: int = Form(...),
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(...),
    category_id: Optional[str] = Form(None),
    series: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    scale: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    condition: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create new product with image uploads (Admin only).
    """
    if price < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must be >= 0")
    if stock_quantity < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity must be >= 0")

    # Clean category_id if empty string or "null"
    cleaned_category_id = None
    if category_id and category_id.strip() and category_id.strip().lower() not in ("null", "undefined", "none"):
        cleaned_category_id = category_id.strip()

    # Upload images
    front_url, back_url = s3_service.upload_product_images(front_image, back_image)
    
    # Create product
    product_data = {
        "name": name.strip(),
        "brand": brand.strip(),
        "series": series.strip() if series else None,
        "model": model.strip() if model else None,
        "category_id": cleaned_category_id,
        "description": description.strip() if description else None,
        "price": price,
        "stock_quantity": stock_quantity,
        "scale": scale.strip() if scale else None,
        "color": color.strip() if color else None,
        "year": year,
        "condition": condition.strip() if condition else None,
        "material": material.strip() if material else None,
        "front_package_image_url": front_url,
        "back_package_image_url": back_url,
        "is_active": is_active if is_active is not None else True
    }
    
    product = ProductRepository.create(db, product_data)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update product (Admin only). Supports both multipart/form-data and JSON payloads.
    Allows changing either image independently.
    """
    existing_product = ProductRepository.get_by_id(db, product_id)
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    content_type = request.headers.get("content-type", "")
    update_data = {}

    if "multipart/form-data" in content_type:
        form = await request.form()
        text_fields = ["name", "brand", "series", "model", "scale", "color", "condition", "material", "description"]
        for field in text_fields:
            if field in form:
                val = form[field]
                update_data[field] = str(val).strip() if val is not None and str(val).strip() != "" else None

        if "category_id" in form:
            cid = str(form["category_id"]).strip()
            update_data["category_id"] = cid if cid and cid.lower() not in ("null", "undefined", "none", "") else None

        if "price" in form and form["price"] is not None and str(form["price"]).strip() != "":
            update_data["price"] = Decimal(str(form["price"]))

        if "stock_quantity" in form and form["stock_quantity"] is not None and str(form["stock_quantity"]).strip() != "":
            update_data["stock_quantity"] = int(form["stock_quantity"])

        if "year" in form:
            y_val = form["year"]
            if y_val is not None and str(y_val).strip() and str(y_val).strip().lower() not in ("null", "undefined", "none"):
                try:
                    update_data["year"] = int(y_val)
                except ValueError:
                    update_data["year"] = None
            else:
                update_data["year"] = None

        if "is_active" in form:
            act_val = str(form["is_active"]).lower()
            update_data["is_active"] = act_val in ("true", "1", "yes")

        # Check for new front image
        front_file = form.get("front_image")
        if front_file and hasattr(front_file, "filename") and front_file.filename:
            new_front_url = s3_service.upload_image(front_file, folder="products/front")
            update_data["front_package_image_url"] = new_front_url

        # Check for new back image
        back_file = form.get("back_image")
        if back_file and hasattr(back_file, "filename") and back_file.filename:
            new_back_url = s3_service.upload_image(back_file, folder="products/back")
            update_data["back_package_image_url"] = new_back_url

    else:
        json_data = await request.json()
        update_data = {k: v for k, v in json_data.items() if v is not None}

    # Validation
    if "price" in update_data and update_data["price"] is not None and Decimal(str(update_data["price"])) < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must be >= 0")
    if "stock_quantity" in update_data and update_data["stock_quantity"] is not None and int(update_data["stock_quantity"]) < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity must be >= 0")

    product = ProductRepository.update(db, product_id, update_data)
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
