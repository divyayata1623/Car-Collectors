"""
User model for authentication and authorization.
"""
from sqlalchemy import Column, String, Boolean, TIMESTAMP, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """
    User model representing both ADMIN and CUSTOMER roles.
    """
    __tablename__ = 'users'
    
    id = Column(UUID, primary_key=True, server_default=text('gen_random_uuid()'))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    
    # Constraints
    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'CUSTOMER')", name='users_role_check'),
    )
    
    # Relationships
    cart_items = relationship('CartItem', back_populates='user', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='user')
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
