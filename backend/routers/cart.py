"""
Shopping cart routes for cart management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from database import get_db
from services.auth import get_current_user
from services.cart import CartService
from schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse
from models.user import User

router = APIRouter()


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's cart.
    """
    cart_items = CartService.get_cart(db, str(current_user.id))
    total = CartService.calculate_cart_total(cart_items)
    
    # Build cart response with subtotals
    cart_item_responses = []
    for item in cart_items:
        subtotal = item.product.price * item.quantity
        cart_item_responses.append(CartItemResponse(
            id=str(item.id),
            product=item.product,
            quantity=item.quantity,
            subtotal=subtotal,
            created_at=item.created_at,
            updated_at=item.updated_at
        ))
    
    return CartResponse(
        items=cart_item_responses,
        total=total
    )


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add item to cart.
    """
    cart_item = CartService.add_to_cart(
        db, str(current_user.id), item_data.product_id, item_data.quantity
    )
    
    subtotal = cart_item.product.price * cart_item.quantity
    
    return CartItemResponse(
        id=str(cart_item.id),
        product=cart_item.product,
        quantity=cart_item.quantity,
        subtotal=subtotal,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.put("/items/{cart_item_id}", response_model=CartItemResponse)
async def update_cart_item(
    cart_item_id: str,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update cart item quantity.
    """
    cart_item = CartService.update_cart_item(
        db, str(current_user.id), cart_item_id, item_data.quantity
    )
    
    subtotal = cart_item.product.price * cart_item.quantity
    
    return CartItemResponse(
        id=str(cart_item.id),
        product=cart_item.product,
        quantity=cart_item.quantity,
        subtotal=subtotal,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.delete("/items/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    cart_item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove item from cart.
    """
    removed = CartService.remove_from_cart(db, str(current_user.id), cart_item_id)
    
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear all items from cart.
    """
    CartService.clear_cart(db, str(current_user.id))
    return None
