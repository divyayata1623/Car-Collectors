"""
CartItem model for shopping cart management.
"""
from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, CheckConstraint, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class CartItem(Base):
    """
    CartItem model representing products in a user's shopping cart.
    Enforces unique constraint on (user_id, product_id) to prevent duplicate items.
    """
    __tablename__ = 'cart_items'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(UUID, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Constraints
    __table_args__ = (
        CheckConstraint('quantity > 0', name='cart_items_quantity_check'),
        UniqueConstraint('user_id', 'product_id', name='cart_items_user_product_unique'),
    )
    
    # Relationships
    user = relationship('User', back_populates='cart_items')
    product = relationship('Product', back_populates='cart_items')
    
    def __repr__(self):
        return f"<CartItem(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, quantity={self.quantity})>"
