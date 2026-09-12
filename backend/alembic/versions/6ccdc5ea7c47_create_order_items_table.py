"""create_order_items_table

Creates the order_items table with the following features:
- UUID primary key with auto-generation
- Foreign key to orders table with CASCADE DELETE
- Foreign key to products table
- Quantity CHECK constraint (> 0)
- Unit_price CHECK constraint (>= 0)
- Subtotal CHECK constraint (>= 0)
- Index on order_id for performance

This migration depends on the orders table (migration 7a3c33910e7a) 
and products table (migration 2cad016e54de).

Revision ID: 6ccdc5ea7c47
Revises: 7a3c33910e7a
Create Date: 2026-09-09 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ccdc5ea7c47'
down_revision: Union[str, None] = '7a3c33910e7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create order_items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.CheckConstraint('quantity > 0', name='order_items_quantity_check'),
        sa.CheckConstraint('unit_price >= 0', name='order_items_unit_price_check'),
        sa.CheckConstraint('subtotal >= 0', name='order_items_subtotal_check'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE', name='order_items_order_id_fkey'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], name='order_items_product_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='order_items_pkey')
    )
    
    # Create index on order_id for faster order item lookups
    op.create_index('idx_order_items_order', 'order_items', ['order_id'])


def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_order_items_order', table_name='order_items')
    
    # Drop order_items table
    op.drop_table('order_items')
