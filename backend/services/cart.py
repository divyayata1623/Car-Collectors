"""
Cart service for shopping cart management with stock validation.
"""
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List, Optional
from decimal import Decimal

from models.cart_item import CartItem
from models.product import Product
from repositories.product import ProductRepository


class CartService:
    """
    Service for shopping cart operations with stock validation.
    """
    
    @staticmethod
    def get_cart(db: Session, user_id: str) -> List[CartItem]:
        """
        Get all cart items for a user with product and category loaded.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            List of CartItem objects with products loaded
        """
        cart_items = db.query(CartItem).options(
            joinedload(CartItem.product).joinedload(Product.category)
        ).filter(CartItem.user_id == user_id).all()
        
        return cart_items
    
    @staticmethod
    def calculate_cart_total(cart_items: List[CartItem]) -> Decimal:
        """
        Calculate total price for cart items.
        
        Args:
            cart_items: List of CartItem objects
            
        Returns:
            Total price as Decimal
        """
        total = Decimal("0.00")
        
        for item in cart_items:
            subtotal = item.product.price * item.quantity
            total += subtotal
        
        return total
    
    @staticmethod
    def add_to_cart(
        db: Session,
        user_id: str,
        product_id: str,
        quantity: int
    ) -> CartItem:
        """
        Add item to cart or update quantity if already exists.
        Validates stock availability.
        
        Args:
            db: Database session
            user_id: User UUID
            product_id: Product UUID
            quantity: Quantity to add
            
        Returns:
            CartItem object
            
        Raises:
            HTTPException: If product not found, inactive, or insufficient stock
        """
        # Validate product exists and is active
        product = ProductRepository.get_by_id(db, product_id)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is no longer available"
            )
        
        # Check if item already in cart
        cart_item = db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id
        ).first()
        
        if cart_item:
            # Update existing cart item
            new_quantity = cart_item.quantity + quantity
            
            # Validate stock
            if not ProductRepository.check_stock(db, product_id, new_quantity):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Only {product.stock_quantity} available."
                )
            
            cart_item.quantity = new_quantity
        else:
            # Validate stock for new item
            if not ProductRepository.check_stock(db, product_id, quantity):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Only {product.stock_quantity} available."
                )
            
            # Create new cart item
            cart_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity
            )
            db.add(cart_item)
        
        db.commit()
        db.refresh(cart_item)
        
        # Load product relationship
        db.refresh(cart_item, ['product'])
        
        return cart_item
    
    @staticmethod
    def update_cart_item(
        db: Session,
        user_id: str,
        cart_item_id: str,
        quantity: int
    ) -> CartItem:
        """
        Update cart item quantity with stock validation.
        
        Args:
            db: Database session
            user_id: User UUID
            cart_item_id: CartItem UUID
            quantity: New quantity
            
        Returns:
            Updated CartItem object
            
        Raises:
            HTTPException: If cart item not found or insufficient stock
        """
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == user_id
        ).first()
        
        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found"
            )
        
        # Validate stock
        if not ProductRepository.check_stock(db, cart_item.product_id, quantity):
            product = ProductRepository.get_by_id(db, cart_item.product_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Only {product.stock_quantity} available."
            )
        
        cart_item.quantity = quantity
        db.commit()
        db.refresh(cart_item)
        
        return cart_item
    
    @staticmethod
    def remove_from_cart(
        db: Session,
        user_id: str,
        cart_item_id: str
    ) -> bool:
        """
        Remove item from cart.
        
        Args:
            db: Database session
            user_id: User UUID
            cart_item_id: CartItem UUID
            
        Returns:
            True if removed, False if not found
        """
        cart_item = db.query(CartItem).filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == user_id
        ).first()
        
        if not cart_item:
            return False
        
        db.delete(cart_item)
        db.commit()
        return True
    
    @staticmethod
    def clear_cart(db: Session, user_id: str) -> None:
        """
        Remove all items from user's cart.
        
        Args:
            db: Database session
            user_id: User UUID
        """
        db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        db.commit()
    
    @staticmethod
    def validate_cart_stock(db: Session, user_id: str) -> List[dict]:
        """
        Validate stock for all items in cart.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            List of dictionaries with items that have insufficient stock
        """
        cart_items = CartService.get_cart(db, user_id)
        insufficient_stock = []
        
        for item in cart_items:
            if not ProductRepository.check_stock(db, item.product_id, item.quantity):
                insufficient_stock.append({
                    "cart_item_id": str(item.id),
                    "product_id": str(item.product_id),
                    "product_name": item.product.name,
                    "requested_quantity": item.quantity,
                    "available_stock": item.product.stock_quantity
                })
        
        return insufficient_stock
