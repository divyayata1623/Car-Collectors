"""
Unit tests for order number generation utilities.

Tests order number generation, sequential counter, thread safety, and format validation.

**Validates: Requirements 8.4, 25.1, 25.2, 19.2**

**Property 23: Order Number Format and Uniqueness**
For any created order, the order_number should match format "CC-YYYYMMDD-XXXXX"
where sequence is a 5-digit zero-padded number, and all order numbers should be unique.
"""
import pytest
from datetime import datetime
from threading import Thread
import re
from unittest.mock import Mock

from utils.order_utils import (
    generate_order_number,
    get_today_date_key,
    reset_daily_counter_cache,
    get_counter_status,
)


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = Mock()
    db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = None
    yield db
    reset_daily_counter_cache()


class TestDateKeyGeneration:
    """Test date key generation."""
    
    def test_today_date_key_format(self):
        """Test that today's date key is in YYYYMMDD format."""
        date_key = get_today_date_key()
        
        # Should be exactly 8 digits
        assert len(date_key) == 8
        assert date_key.isdigit()
        
        # Should match today's date
        today = datetime.utcnow().strftime("%Y%m%d")
        assert date_key == today


class TestOrderNumberFormat:
    """Test order number format and structure.
    
    **Validates: Requirements 8.4, 25.1, 25.2**
    """
    
    def test_order_number_matches_format(self, mock_db):
        """Test that generated order number matches format CC-YYYYMMDD-XXXXX."""
        reset_daily_counter_cache()
        order_number = generate_order_number(mock_db)
        
        # Pattern: CC-{8 digits}-{5 digits}
        pattern = r'^CC-\d{8}-\d{5}$'
        assert re.match(pattern, order_number), \
            f"Order number '{order_number}' does not match expected format CC-YYYYMMDD-XXXXX"
    
    def test_order_number_contains_correct_date(self, mock_db):
        """Test that order number contains today's date."""
        reset_daily_counter_cache()
        order_number = generate_order_number(mock_db)
        today = get_today_date_key()
        
        # Extract date portion from order number (CC-{DATE}-XXXXX)
        parts = order_number.split('-')
        assert len(parts) == 3, f"Expected 3 parts, got {len(parts)}"
        assert parts[0] == "CC", f"Expected prefix 'CC', got '{parts[0]}'"
        assert parts[1] == today, f"Expected date {today}, got {parts[1]}"
        assert len(parts[2]) == 5, f"Expected 5-digit sequence, got {len(parts[2])}"
    
    def test_order_number_sequence_is_5_digits(self, mock_db):
        """Test that sequence number is exactly 5 digits with leading zeros."""
        reset_daily_counter_cache()
        order_number = generate_order_number(mock_db)
        
        sequence = order_number.split('-')[-1]
        assert len(sequence) == 5, f"Expected 5 digits, got {len(sequence)}"
        assert sequence.isdigit(), "Sequence should be all digits"
        assert sequence == "00001", f"First sequence should be '00001', got '{sequence}'"
    
    def test_sequence_starts_at_00001(self, mock_db):
        """Test that sequence counter starts at 00001."""
        reset_daily_counter_cache()
        
        order_number = generate_order_number(mock_db)
        sequence = order_number.split('-')[-1]
        
        assert sequence == "00001", f"First sequence should be '00001', got '{sequence}'"
    
    def test_leading_zeros_are_preserved(self, mock_db):
        """Test that leading zeros are preserved in sequence."""
        reset_daily_counter_cache()
        
        # Generate first order (should end with 00001)
        order_number1 = generate_order_number(mock_db)
        assert order_number1.endswith("00001"), \
            f"First order should end with '00001', got '{order_number1}'"
        
        # Generate second order (should end with 00002)
        order_number2 = generate_order_number(mock_db)
        assert order_number2.endswith("00002"), \
            f"Second order should end with '00002', got '{order_number2}'"
        
        # Generate tenth order (should end with 00010)
        for _ in range(8):
            generate_order_number(mock_db)
        order_number10 = generate_order_number(mock_db)
        assert order_number10.endswith("00010"), \
            f"Tenth order should end with '00010', got '{order_number10}'"


class TestSequentialCounter:
    """Test sequential counter behavior.
    
    **Validates: Requirements 25.3, 25.4, 25.5**
    """
    
    def test_counter_increments_sequentially(self, mock_db):
        """Test that counter increments by 1 each call."""
        reset_daily_counter_cache()
        
        previous_sequence = 0
        for i in range(10):
            order_number = generate_order_number(mock_db)
            sequence = int(order_number.split('-')[-1])
            
            assert sequence == previous_sequence + 1, \
                f"Expected sequence {previous_sequence + 1}, got {sequence}"
            previous_sequence = sequence
    
    def test_sequence_values_correct(self, mock_db):
        """Test that sequence values increment correctly."""
        reset_daily_counter_cache()
        
        sequences = []
        for i in range(5):
            order_number = generate_order_number(mock_db)
            sequence = int(order_number.split('-')[-1])
            sequences.append(sequence)
        
        # Should be: 1, 2, 3, 4, 5
        assert sequences == [1, 2, 3, 4, 5], \
            f"Expected [1, 2, 3, 4, 5], got {sequences}"


class TestUniqueness:
    """Test order number uniqueness.
    
    **Validates: Requirement 19.2**
    """
    
    def test_generated_order_numbers_are_unique(self, mock_db):
        """Test that generated order numbers are always unique."""
        reset_daily_counter_cache()
        
        order_numbers = set()
        for _ in range(100):
            order_number = generate_order_number(mock_db)
            
            # Should not be in set (ensuring uniqueness)
            assert order_number not in order_numbers, \
                f"Duplicate order number generated: {order_number}"
            order_numbers.add(order_number)
        
        assert len(order_numbers) == 100, \
            f"Expected 100 unique order numbers, got {len(order_numbers)}"
    
    def test_all_order_numbers_different_in_single_day(self, mock_db):
        """Test that all order numbers are different for orders in same day."""
        reset_daily_counter_cache()
        
        first_order = generate_order_number(mock_db)
        second_order = generate_order_number(mock_db)
        
        assert first_order != second_order, "Order numbers should be different"
        
        # Same date component
        first_date = first_order.split('-')[1]
        second_date = second_order.split('-')[1]
        assert first_date == second_date, "Orders should have same date"
        
        # Different sequence
        first_seq = first_order.split('-')[2]
        second_seq = second_order.split('-')[2]
        assert first_seq != second_seq, "Orders should have different sequences"


class TestCacheOperations:
    """Test cache-related operations."""
    
    def test_counter_status_reports_current_state(self, mock_db):
        """Test that counter status correctly reports current state."""
        reset_daily_counter_cache()
        today = get_today_date_key()
        
        # Generate 5 orders
        for _ in range(5):
            generate_order_number(mock_db)
        
        status = get_counter_status()
        assert status['today'] == today, f"Expected today '{today}', got '{status['today']}'"
        assert status['next_sequence_for_today'] == 6, \
            f"Expected next sequence 6, got {status['next_sequence_for_today']}"
    
    def test_cache_reset_clears_counter(self, mock_db):
        """Test that cache reset clears the counter."""
        reset_daily_counter_cache()
        
        # Generate some orders
        for _ in range(3):
            generate_order_number(mock_db)
        
        # Verify counter is at 3
        status_before = get_counter_status()
        assert status_before['next_sequence_for_today'] >= 4
        
        # Reset cache
        reset_daily_counter_cache()
        
        # Next order should start fresh
        next_order = generate_order_number(mock_db)
        assert next_order.endswith("00001"), \
            f"After cache reset, first order should be 00001, got '{next_order}'"


class TestThreadSafety:
    """Test thread-safe counter operations.
    
    **Validates: Requirement 12.1 (thread-safe requirement)**
    """
    
    def test_concurrent_order_generation_produces_unique_numbers(self, mock_db):
        """Test that concurrent threads generate unique order numbers."""
        reset_daily_counter_cache()
        
        generated_orders = []
        lock = __import__('threading').Lock()
        
        def generate_orders():
            for _ in range(10):
                order_number = generate_order_number(mock_db)
                with lock:
                    generated_orders.append(order_number)
        
        # Create 5 threads, each generating 10 orders
        threads = []
        for _ in range(5):
            thread = Thread(target=generate_orders)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check uniqueness
        assert len(generated_orders) == 50, f"Expected 50 orders, got {len(generated_orders)}"
        unique_orders = set(generated_orders)
        assert len(unique_orders) == 50, \
            f"Duplicate order numbers generated in concurrent execution: {50 - len(unique_orders)} duplicates"
    
    def test_concurrent_counter_increments_correctly(self, mock_db):
        """Test that counter increments correctly under concurrent access."""
        reset_daily_counter_cache()
        
        generated_sequences = []
        lock = __import__('threading').Lock()
        
        def generate_orders():
            for _ in range(10):
                order_number = generate_order_number(mock_db)
                sequence = int(order_number.split('-')[-1])
                with lock:
                    generated_sequences.append(sequence)
        
        # Create 5 threads
        threads = []
        for _ in range(5):
            thread = Thread(target=generate_orders)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # Should have generated 50 unique sequences
        unique_sequences = set(generated_sequences)
        assert len(unique_sequences) == 50, \
            f"Sequences are not unique under concurrent access: {len(unique_sequences)} unique out of 50"
        
        # All sequences should be between 1 and 50
        assert min(generated_sequences) == 1, f"Min sequence should be 1, got {min(generated_sequences)}"
        assert max(generated_sequences) == 50, f"Max sequence should be 50, got {max(generated_sequences)}"


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_max_sequence_per_day_limit(self, mock_db):
        """Test behavior when approaching maximum sequence per day."""
        reset_daily_counter_cache()
        
        # Create a mock order that simulates an order with high sequence number
        last_order_mock = Mock()
        last_order_mock.order_number = f"CC-{get_today_date_key()}-99999"
        
        # Mock the database query to return the high sequence order
        mock_db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = last_order_mock
        
        # Next order should exceed limit
        with pytest.raises(ValueError, match="Order sequence limit exceeded"):
            generate_order_number(mock_db)
    
    def test_format_has_exactly_three_components(self, mock_db):
        """Test that order number has exactly three components separated by hyphens."""
        reset_daily_counter_cache()
        
        for _ in range(20):
            order_number = generate_order_number(mock_db)
            parts = order_number.split('-')
            
            assert len(parts) == 3, \
                f"Expected 3 components, got {len(parts)} in '{order_number}'"
            assert parts[0] == "CC", f"Prefix should be 'CC', got '{parts[0]}'"
            assert len(parts[1]) == 8, f"Date should be 8 digits, got {len(parts[1])}"
            assert len(parts[2]) == 5, f"Sequence should be 5 digits, got {len(parts[2])}"


# ============================================================================
# PROPERTY-BASED TESTS USING HYPOTHESIS
# ============================================================================

try:
    from hypothesis import given, strategies as st, example, settings
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False


@pytest.mark.skipif(not HYPOTHESIS_AVAILABLE, reason="Hypothesis not installed")
class TestOrderNumberProperties:
    """Property-based tests for order number generation.
    
    **Validates: Requirements 8.4, 25.1, 25.2, 19.2**
    
    **Property 23: Order Number Format and Uniqueness**
    For any created order, the order_number should match format "CC-YYYYMMDD-XXXXX"
    where sequence is a 5-digit zero-padded number, and all order numbers should be unique.
    """
    
    @given(st.integers(min_value=1, max_value=100))
    @example(1)
    @example(10)
    @example(100)
    @settings(max_examples=10)
    def test_generated_format_matches_spec(self, num_orders):
        """Property: All generated order numbers match the specified format.
        
        For any number of orders generated, each order_number should match:
        - Pattern: CC-YYYYMMDD-XXXXX
        - CC: literal "CC"
        - YYYYMMDD: today's date (8 digits)
        - XXXXX: sequence (5 digits, zero-padded)
        """
        reset_daily_counter_cache()
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = None
        pattern = r'^CC-\d{8}-\d{5}$'
        
        for _ in range(num_orders):
            order_number = generate_order_number(mock_db)
            assert re.match(pattern, order_number), \
                f"Order '{order_number}' doesn't match format CC-YYYYMMDD-XXXXX"
    
    @given(st.integers(min_value=1, max_value=50))
    @example(1)
    @example(25)
    @example(50)
    @settings(max_examples=10)
    def test_uniqueness_property(self, num_orders):
        """Property: All generated order numbers are globally unique.
        
        For any set of orders generated in sequence, all order_numbers
        should be unique (no duplicates).
        """
        reset_daily_counter_cache()
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = None
        
        order_numbers = set()
        for _ in range(num_orders):
            order_number = generate_order_number(mock_db)
            assert order_number not in order_numbers, \
                f"Duplicate order number: {order_number}"
            order_numbers.add(order_number)
        
        assert len(order_numbers) == num_orders
    
    @given(st.integers(min_value=1, max_value=100))
    @example(1)
    @example(50)
    @example(100)
    @settings(max_examples=10)
    def test_sequence_increment_property(self, num_orders):
        """Property: Sequence numbers increment by 1 for each order.
        
        For any sequence of orders, the sequence component should
        increment by exactly 1 for each successive order.
        """
        reset_daily_counter_cache()
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = None
        
        previous_seq = 0
        for _ in range(num_orders):
            order_number = generate_order_number(mock_db)
            sequence = int(order_number.split('-')[-1])
            
            assert sequence == previous_seq + 1, \
                f"Expected sequence {previous_seq + 1}, got {sequence}"
            previous_seq = sequence
    
    @given(st.integers(min_value=1, max_value=100))
    @example(1)
    @example(50)
    @example(100)
    @settings(max_examples=10)
    def test_date_consistency_property(self, num_orders):
        """Property: All order numbers generated same day have same date component.
        
        For all orders generated on the same day, the date portion (YYYYMMDD)
        should be identical across all order numbers.
        """
        reset_daily_counter_cache()
        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.order_by.return_value.desc.return_value.first.return_value = None
        today_key = get_today_date_key()
        
        for _ in range(num_orders):
            order_number = generate_order_number(mock_db)
            parts = order_number.split('-')
            date_part = parts[1]
            
            assert date_part == today_key, \
                f"Date mismatch: expected {today_key}, got {date_part}"
