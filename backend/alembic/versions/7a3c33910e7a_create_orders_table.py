"""create_orders_table

Creates the orders table with the following features:
- UUID primary key with auto-generation
- Unique order_number constraint
- Foreign key to users table
- Status CHECK constraint (PENDING, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- Total amount CHECK constraint (>= 0)
- Four indexes for performance: user_id, status, created_at DESC, order_number

This migration depends on the users table (migration aa66435dca01).

Revision ID: 7a3c33910e7a
Revises: aa66435dca01
Create Date: 2026-09-09 17:46:01.334936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a3c33910e7a'
down_revision: Union[str, None] = 'aa66435dca01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint(
            "status IN ('PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')",
            name='orders_status_check'
        ),
        sa.CheckConstraint('total_amount >= 0', name='orders_total_amount_check'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='orders_user_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='orders_pkey'),
        sa.UniqueConstraint('order_number', name='orders_order_number_key')
    )
    
    # Create indexes
    op.create_index('idx_orders_user', 'orders', ['user_id'])
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_created_at', 'orders', [sa.text('created_at DESC')])
    op.create_index('idx_orders_order_number', 'orders', ['order_number'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_orders_order_number', table_name='orders')
    op.drop_index('idx_orders_created_at', table_name='orders')
    op.drop_index('idx_orders_status', table_name='orders')
    op.drop_index('idx_orders_user', table_name='orders')
    
    # Drop table
    op.drop_table('orders')
