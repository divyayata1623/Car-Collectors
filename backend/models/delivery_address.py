"""
DeliveryAddress model for order shipping information.
"""
from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class DeliveryAddress(Base):
    """
    DeliveryAddress model representing shipping information for orders.
    """
    __tablename__ = 'delivery_addresses'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    order_id = Column(UUID, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    address_line = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Relationships
    order = relationship('Order', back_populates='delivery_address')
    
    def __repr__(self):
        return f"<DeliveryAddress(id={self.id}, order_id={self.order_id}, city='{self.city}', state='{self.state}')>"
