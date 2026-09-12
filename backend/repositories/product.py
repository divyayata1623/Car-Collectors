"""
Product repository for database operations with filtering, search, and pagination.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import List, Optional, Tuple
from decimal import Decimal

from models.product import Product
from models.category import Category
from schemas.common import PaginationParams


class ProductRepository:
    """
    Repository for Product database operations including filtering, search, and pagination.
    """
    
    @staticmethod
    def get_by_id(db: Session, product_id: str) -> Optional[Product]:
        """
        Get product by ID with category relationship loaded.
        
        Args:
            db: Database session
            product_id: Product UUID
            
        Returns:
            Product object or None if not found
        """
        return db.query(Product).options(
            joinedload(Product.category)
        ).filter(Product.id == product_id).first()
    
    @staticmethod
    def get_all_paginated(
        db: Session,
        pagination: PaginationParams,
        category_id: Optional[str] = None,
        brand: Optional[str] = None,
        series: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        search: Optional[str] = None,
        is_active: bool = True
    ) -> Tuple[List[Product], int]:
        """
        Get paginated products with filtering and search.
        
        Args:
            db: Database session
            pagination: Pagination parameters (page, limit)
            category_id: Filter by category UUID
            brand: Filter by brand name
            series: Filter by series name
            min_price: Minimum price filter
            max_price: Maximum price filter
            search: Search term for name/brand/series/model
            is_active: Filter by active status (default: True)
            
        Returns:
            Tuple of (products list, total count)
        """
        query = db.query(Product).options(joinedload(Product.category))
        
        # Apply filters
        filters = [Product.is_active == is_active]
        
        if category_id:
            filters.append(Product.category_id == category_id)
        
        if brand:
            filters.append(Product.brand.ilike(f"%{brand}%"))
        
        if series:
            filters.append(Product.series.ilike(f"%{series}%"))
        
        if min_price is not None:
            filters.append(Product.price >= min_price)
        
        if max_price is not None:
            filters.append(Product.price <= max_price)
        
        # Apply search across multiple fields
        if search:
            search_filter = or_(
                Product.name.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
                Product.series.ilike(f"%{search}%"),
                Product.model.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        query = query.filter(and_(*filters))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.limit
        products = query.order_by(Product.created_at.desc()).offset(offset).limit(pagination.limit).all()
        
        return products, total
    
    @staticmethod
    def create(db: Session, product_data: dict) -> Product:
        """
        Create a new product.
        
        Args:
            db: Database session
            product_data: Product data dictionary
            
        Returns:
            Created Product object
        """
        product = Product(**product_data)
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def update(db: Session, product_id: str, update_data: dict) -> Optional[Product]:
        """
        Update product by ID.
        
        Args:
            db: Database session
            product_id: Product UUID
            update_data: Dictionary with fields to update
            
        Returns:
            Updated Product object or None if not found
        """
        product = ProductRepository.get_by_id(db, product_id)
        
        if not product:
            return None
        
        # Update only provided fields
        for key, value in update_data.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)
        
        db.commit()
        db.refresh(product)
        return product
    
    @staticmethod
    def delete(db: Session, product_id: str) -> bool:
        """
        Delete product by ID (soft delete by setting is_active=False).
        
        Args:
            db: Database session
            product_id: Product UUID
            
        Returns:
            True if deleted, False if not found
        """
        product = ProductRepository.get_by_id(db, product_id)
        
        if not product:
            return False
        
        product.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def get_brands(db: Session) -> List[str]:
        """
        Get all unique brands.
        
        Args:
            db: Database session
            
        Returns:
            List of brand names
        """
        brands = db.query(Product.brand).filter(
            Product.is_active == True
        ).distinct().order_by(Product.brand).all()
        
        return [brand[0] for brand in brands if brand[0]]
    
    @staticmethod
    def get_series(db: Session, brand: Optional[str] = None) -> List[str]:
        """
        Get all unique series, optionally filtered by brand.
        
        Args:
            db: Database session
            brand: Optional brand filter
            
        Returns:
            List of series names
        """
        query = db.query(Product.series).filter(
            Product.is_active == True,
            Product.series.isnot(None)
        )
        
        if brand:
            query = query.filter(Product.brand.ilike(f"%{brand}%"))
        
        series = query.distinct().order_by(Product.series).all()
        
        return [s[0] for s in series if s[0]]
    
    @staticmethod
    def check_stock(db: Session, product_id: str, quantity: int) -> bool:
        """
        Check if product has sufficient stock.
        
        Args:
            db: Database session
            product_id: Product UUID
            quantity: Requested quantity
            
        Returns:
            True if stock sufficient, False otherwise
        """
        product = ProductRepository.get_by_id(db, product_id)
        
        if not product or not product.is_active:
            return False
        
        return product.stock_quantity >= quantity
    
    @staticmethod
    def update_stock(db: Session, product_id: str, quantity_change: int) -> Optional[Product]:
        """
        Update product stock quantity (can be positive or negative).
        
        Args:
            db: Database session
            product_id: Product UUID
            quantity_change: Amount to add (positive) or subtract (negative)
            
        Returns:
            Updated Product object or None if not found
        """
        product = ProductRepository.get_by_id(db, product_id)
        
        if not product:
            return None
        
        product.stock_quantity += quantity_change
        
        # Ensure stock doesn't go negative
        if product.stock_quantity < 0:
            product.stock_quantity = 0
        
        db.commit()
        db.refresh(product)
        return product
