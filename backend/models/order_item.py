"""
OrderItem model for products within orders.
"""
from sqlalchemy import Column, Integer, Numeric, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class OrderItem(Base):
    """
    OrderItem model representing product snapshots within an order.
    Captures unit_price and subtotal at time of order creation.
    """
    __tablename__ = 'order_items'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    order_id = Column(UUID, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(UUID, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('quantity > 0', name='order_items_quantity_check'),
        CheckConstraint('unit_price >= 0', name='order_items_unit_price_check'),
        CheckConstraint('subtotal >= 0', name='order_items_subtotal_check'),
    )
    
    # Relationships
    order = relationship('Order', back_populates='order_items')
    product = relationship('Product', back_populates='order_items')
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity}, subtotal={self.subtotal})>"
