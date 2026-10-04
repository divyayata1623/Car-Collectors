"""
Product model for die-cast model cars.
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, Boolean, TIMESTAMP, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Product(Base):
    """
    Product model representing die-cast model cars with dual package images.
    """
    __tablename__ = 'products'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False, index=True)
    series = Column(String(100), nullable=True, index=True)
    model = Column(String(100), nullable=True)
    category_id = Column(UUID, ForeignKey('categories.id'), nullable=True, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, index=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    scale = Column(String(50), nullable=True)
    color = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    condition = Column(String(100), nullable=True)
    material = Column(String(100), nullable=True)
    front_package_image_url = Column(String(500), nullable=False)
    back_package_image_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'), index=True)
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Constraints
    __table_args__ = (
        CheckConstraint('price >= 0', name='products_price_check'),
        CheckConstraint('stock_quantity >= 0', name='products_stock_quantity_check'),
    )
    
    # Relationships
    category = relationship('Category', back_populates='products')
    cart_items = relationship('CartItem', back_populates='product', cascade='all, delete-orphan')
    order_items = relationship('OrderItem', back_populates='product')
    
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', brand='{self.brand}', price={self.price})>"
