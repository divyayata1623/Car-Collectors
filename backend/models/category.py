"""
Category model for product classification.
"""
from sqlalchemy import Column, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Category(Base):
    """
    Category model for organizing products.
    """
    __tablename__ = 'categories'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Relationships
    products = relationship('Product', back_populates='category')
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', slug='{self.slug}')>"
