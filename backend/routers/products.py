"""
Product routes for browsing and searching products.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal

from database import get_db
from repositories.product import ProductRepository
from schemas.product import ProductResponse, ProductListResponse
from schemas.common import PaginationParams, PaginationMeta
from schemas.category import CategoryResponse
from models.category import Category
import math

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[str] = None,
    brand: Optional[str] = None,
    series: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get paginated list of products with filtering and search.
    """
    pagination = PaginationParams(page=page, limit=limit)
    
    products, total = ProductRepository.get_all_paginated(
        db=db,
        pagination=pagination,
        category_id=category_id,
        brand=brand,
        series=series,
        min_price=min_price,
        max_price=max_price,
        search=search
    )
    
    total_pages = math.ceil(total / pagination.limit) if total > 0 else 0
    
    return ProductListResponse(
        products=products,
        pagination=PaginationMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            total_pages=total_pages
        )
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    """
    Get single product by ID.
    """
    product = ProductRepository.get_by_id(db, product_id)
    
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.get("/filters/brands", response_model=list[str])
async def get_brands(db: Session = Depends(get_db)):
    """
    Get all unique product brands.
    """
    return ProductRepository.get_brands(db)


@router.get("/filters/series", response_model=list[str])
async def get_series(brand: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get all unique product series, optionally filtered by brand.
    """
    return ProductRepository.get_series(db, brand)


@router.get("/categories/all", response_model=list[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """
    Get all product categories.
    """
    categories = db.query(Category).order_by(Category.name).all()
    return categories
