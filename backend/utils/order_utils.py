"""
Order utility functions for order number generation and management.

This module provides utilities for generating unique, traceable order numbers
with thread-safe sequential counter handling for the CAR COLLECTORS platform.
"""
from datetime import datetime
from threading import Lock
from typing import Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models.order import Order


# Thread-safe lock for counter operations
_counter_lock = Lock()

# In-memory cache for today's counter (format: YYYYMMDD -> counter)
_daily_counter_cache: Dict[str, int] = {}


def get_today_date_key() -> str:
    """
    Get today's date in YYYYMMDD format.
    
    Returns:
        Today's date as string in YYYYMMDD format (e.g., "20260910")
    """
    return datetime.utcnow().strftime("%Y%m%d")


def get_next_sequence_number(db: Session, date_key: str) -> int:
    """
    Get the next sequence number for a given date, with thread-safe handling.
    
    This function queries the database to find the highest sequence number
    for the given date, increments it, and caches the result for performance.
    
    Preconditions:
    - db is a valid SQLAlchemy session
    - date_key is in YYYYMMDD format
    
    Postconditions:
    - Returns an integer sequence number (1-99999)
    - Subsequent calls for the same date return incremented numbers
    - Counter resets daily (new date returns 1)
    - Function is thread-safe via Lock
    
    Args:
        db: SQLAlchemy database session
        date_key: Date in YYYYMMDD format
        
    Returns:
        Next sequence number as integer (1-99999)
        
    Raises:
        ValueError: If sequence exceeds 99999 (limit reached for the day)
    """
    with _counter_lock:
        today_key = get_today_date_key()
        
        # Reset cache if date has changed
        if today_key not in _daily_counter_cache and date_key == today_key:
            _daily_counter_cache.clear()
            _daily_counter_cache[today_key] = 0
        
        # If not today's date, query database fresh each time (no caching for past dates)
        if date_key != today_key:
            last_order = db.query(Order).filter(
                Order.order_number.like(f"CC-{date_key}-%")
            ).order_by(Order.order_number.desc()).first()
            
            if last_order:
                # Extract sequence from order number (format: CC-YYYYMMDD-XXXXX)
                sequence_str = last_order.order_number.split('-')[-1]
                sequence = int(sequence_str)
                return sequence + 1
            else:
                return 1
        
        # For today, use cached counter
        current_sequence = _daily_counter_cache.get(today_key, 0)
        next_sequence = current_sequence + 1
        
        # Validate sequence hasn't exceeded the limit
        if next_sequence > 99999:
            raise ValueError(
                f"Order sequence limit exceeded for date {date_key}. "
                f"Maximum 99999 orders allowed per day."
            )
        
        # Update cache with next sequence
        _daily_counter_cache[today_key] = next_sequence
        
        return next_sequence


def generate_order_number(db: Session) -> str:
    """
    Generate a unique order number with format: CC-YYYYMMDD-XXXXX
    
    Format breakdown:
    - CC: Fixed prefix for CAR COLLECTORS
    - YYYYMMDD: Current date (year, month, day)
    - XXXXX: 5-digit zero-padded sequential counter (00001-99999)
    
    The counter resets daily and is thread-safe.
    
    Preconditions:
    - db is a valid SQLAlchemy session
    - Database order_number column is UNIQUE
    
    Postconditions:
    - Returns unique order number string matching format CC-YYYYMMDD-XXXXX
    - Order number is globally unique across all time
    - Same date with different orders produces different sequence numbers
    - Function is thread-safe for concurrent calls
    
    Example:
        >>> generate_order_number(db)
        "CC-20260910-00001"
        >>> generate_order_number(db)
        "CC-20260910-00002"
        >>> # Next day
        >>> generate_order_number(db)
        "CC-20260911-00001"
    
    Args:
        db: SQLAlchemy database session
        
    Returns:
        Unique order number string in format CC-YYYYMMDD-XXXXX
        
    Raises:
        ValueError: If daily sequence limit (99999) is exceeded
    """
    date_key = get_today_date_key()
    sequence = get_next_sequence_number(db, date_key)
    
    # Format: CC-YYYYMMDD-XXXXX (5-digit zero-padded sequence)
    order_number = f"CC-{date_key}-{sequence:05d}"
    
    return order_number


def reset_daily_counter_cache() -> None:
    """
    Reset the in-memory daily counter cache.
    
    This is useful for testing or manual cache invalidation.
    Should only be called during testing or maintenance operations.
    
    Thread-safe operation using internal lock.
    """
    with _counter_lock:
        _daily_counter_cache.clear()


def get_counter_status() -> Dict:
    """
    Get the current status of the daily counter cache.
    
    Useful for debugging and monitoring the counter state.
    
    Returns:
        Dictionary with current cache status
        
    Example:
        {
            "today": "20260910",
            "cache": {"20260910": 42},
            "next_sequence_for_today": 43
        }
    """
    with _counter_lock:
        today_key = get_today_date_key()
        current_counter = _daily_counter_cache.get(today_key, 0)
        
        return {
            "today": today_key,
            "cache": _daily_counter_cache.copy(),
            "next_sequence_for_today": current_counter + 1
        }
