"""Shipping settings schemas."""
from decimal import Decimal
from pydantic import BaseModel, Field


class ShippingSettingsResponse(BaseModel):
    flat_fee: Decimal
    free_shipping_threshold: Decimal


class ShippingSettingsUpdate(BaseModel):
    flat_fee: Decimal = Field(..., ge=0)
    free_shipping_threshold: Decimal = Field(..., ge=0)
