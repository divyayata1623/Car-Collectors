"""
Order model for purchase transactions.
"""
from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Order(Base):
    """
    Order model representing confirmed purchase transactions.
    """
    __tablename__ = 'orders'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(UUID, ForeignKey('users.id'), nullable=False, index=True)
    status = Column(String(30), nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'), index=True)
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')",
            name='orders_status_check'
        ),
        CheckConstraint('total_amount >= 0', name='orders_total_amount_check'),
    )
    
    # Relationships
    user = relationship('User', back_populates='orders')
    order_items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    delivery_address = relationship('DeliveryAddress', back_populates='order', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<Order(id={self.id}, order_number='{self.order_number}', status='{self.status}', total_amount={self.total_amount})>"
