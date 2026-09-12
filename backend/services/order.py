"""
Order service for order creation, management, and status tracking.
"""
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import random
import string

from models.order import Order
from models.order_item import OrderItem
from models.delivery_address import DeliveryAddress
from models.cart_item import CartItem
from models.product import Product
from repositories.product import ProductRepository
from services.cart import CartService
from schemas.order import OrderCreate


class OrderService:
    """
    Service for order creation and management with atomic transactions.
    """
    
    @staticmethod
    def generate_order_number() -> str:
        """
        Generate unique order number with format: ORD-YYYYMMDD-XXXXXX
        
        Returns:
            Unique order number string
        """
        date_part = datetime.now().strftime("%Y%m%d")
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD-{date_part}-{random_part}"
    
    @staticmethod
    def create_order(
        db: Session,
        user_id: str,
        order_data: OrderCreate
    ) -> Order:
        """
        Create order from cart with atomic transaction.
        Validates stock, creates order, order items, delivery address, and clears cart.
        
        Args:
            db: Database session
            user_id: User UUID
            order_data: Order creation data with delivery address
            
        Returns:
            Created Order object with all relationships loaded
            
        Raises:
            HTTPException: If cart empty, insufficient stock, or transaction fails
        """
        try:
            # Get cart items
            cart_items = CartService.get_cart(db, user_id)
            
            if not cart_items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty"
                )
            
            # Validate stock for all items
            insufficient_stock = CartService.validate_cart_stock(db, user_id)
            
            if insufficient_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient stock for some items",
                    headers={"X-Insufficient-Stock": str(insufficient_stock)}
                )
            
            # Calculate total
            total_amount = Decimal("0.00")
            for item in cart_items:
                total_amount += item.product.price * item.quantity
            
            # Generate unique order number
            order_number = OrderService.generate_order_number()
            
            # Ensure order number is unique
            while db.query(Order).filter(Order.order_number == order_number).first():
                order_number = OrderService.generate_order_number()
            
            # Create order
            order = Order(
                order_number=order_number,
                user_id=user_id,
                status="PENDING",
                total_amount=total_amount
            )
            db.add(order)
            db.flush()  # Get order ID without committing
            
            # Create order items and update stock
            for cart_item in cart_items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=cart_item.product_id,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.price,
                    subtotal=cart_item.product.price * cart_item.quantity
                )
                db.add(order_item)
                
                # Decrease product stock
                ProductRepository.update_stock(db, cart_item.product_id, -cart_item.quantity)
            
            # Create delivery address
            delivery_address = DeliveryAddress(
                order_id=order.id,
                full_name=order_data.delivery_address.full_name,
                mobile=order_data.delivery_address.mobile,
                address_line=order_data.delivery_address.address_line,
                city=order_data.delivery_address.city,
                state=order_data.delivery_address.state,
                pincode=order_data.delivery_address.pincode
            )
            db.add(delivery_address)
            
            # Clear cart
            CartService.clear_cart(db, user_id)
            
            # Commit transaction
            db.commit()
            db.refresh(order)
            
            # Load relationships
            order = db.query(Order).options(
                joinedload(Order.order_items).joinedload(OrderItem.product),
                joinedload(Order.delivery_address)
            ).filter(Order.id == order.id).first()
            
            return order
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create order: {str(e)}"
            )
    
    @staticmethod
    def get_order_by_id(db: Session, order_id: str, user_id: Optional[str] = None) -> Optional[Order]:
        """
        Get order by ID with all relationships loaded.
        
        Args:
            db: Database session
            order_id: Order UUID
            user_id: Optional user UUID for ownership validation
            
        Returns:
            Order object or None if not found
        """
        query = db.query(Order).options(
            joinedload(Order.order_items).joinedload(OrderItem.product),
            joinedload(Order.delivery_address)
        ).filter(Order.id == order_id)
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        return query.first()
    
    @staticmethod
    def get_user_orders(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 20
    ) -> tuple[List[Order], int]:
        """
        Get paginated orders for a user.
        
        Args:
            db: Database session
            user_id: User UUID
            page: Page number
            limit: Items per page
            
        Returns:
            Tuple of (orders list, total count)
        """
        query = db.query(Order).options(
            joinedload(Order.order_items).joinedload(OrderItem.product),
            joinedload(Order.delivery_address)
        ).filter(Order.user_id == user_id)
        
        total = query.count()
        
        offset = (page - 1) * limit
        orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
        
        return orders, total
    
    @staticmethod
    def get_all_orders(
        db: Session,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None
    ) -> tuple[List[Order], int]:
        """
        Get paginated orders (admin only).
        
        Args:
            db: Database session
            page: Page number
            limit: Items per page
            status: Optional status filter
            
        Returns:
            Tuple of (orders list, total count)
        """
        query = db.query(Order).options(
            joinedload(Order.order_items).joinedload(OrderItem.product),
            joinedload(Order.delivery_address),
            joinedload(Order.user)
        )
        
        if status:
            query = query.filter(Order.status == status)
        
        total = query.count()
        
        offset = (page - 1) * limit
        orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
        
        return orders, total
    
    @staticmethod
    def update_order_status(
        db: Session,
        order_id: str,
        new_status: str
    ) -> Order:
        """
        Update order status (admin only).
        
        Args:
            db: Database session
            order_id: Order UUID
            new_status: New order status
            
        Returns:
            Updated Order object
            
        Raises:
            HTTPException: If order not found or invalid status
        """
        valid_statuses = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
        
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # If cancelling order, restore stock
        if new_status == "CANCELLED" and order.status != "CANCELLED":
            for order_item in order.order_items:
                ProductRepository.update_stock(db, order_item.product_id, order_item.quantity)
        
        order.status = new_status
        db.commit()
        db.refresh(order)
        
        return order
