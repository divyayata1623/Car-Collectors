"""create_delivery_addresses_table

Creates the delivery_addresses table with the following features:
- UUID primary key with auto-generation
- Foreign key to orders table with ON DELETE CASCADE
- Address fields: full_name, mobile, address_line, city, state, pincode
- created_at timestamp with server default
- Index on order_id for faster delivery address lookups

This migration depends on the orders table (migration 7a3c33910e7a).

Revision ID: e10f67847e10
Revises: 7a3c33910e7a
Create Date: 2026-09-10 10:15:30.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e10f67847e10'
down_revision: Union[str, None] = '7a3c33910e7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create delivery_addresses table
    op.create_table(
        'delivery_addresses',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('mobile', sa.String(length=20), nullable=False),
        sa.Column('address_line', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], name='delivery_addresses_order_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='delivery_addresses_pkey')
    )
    
    # Create index on order_id for faster delivery address lookups
    op.create_index('idx_delivery_addresses_order', 'delivery_addresses', ['order_id'])


def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_delivery_addresses_order', table_name='delivery_addresses')
    
    # Drop table
    op.drop_table('delivery_addresses')
