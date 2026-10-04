"""Persistent shipping configuration managed by administrators."""
from sqlalchemy import Column, Integer, Numeric, TIMESTAMP, text
from database import Base


class ShippingSetting(Base):
    __tablename__ = "shipping_settings"

    id = Column(Integer, primary_key=True, default=1)
    flat_fee = Column(Numeric(10, 2), nullable=False, default=0)
    free_shipping_threshold = Column(Numeric(10, 2), nullable=False, default=0)
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
