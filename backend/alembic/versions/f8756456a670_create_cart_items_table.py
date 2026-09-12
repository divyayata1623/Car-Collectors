"""create_cart_items_table

Revision ID: f8756456a670
Revises: 2cad016e54de
Create Date: 2026-09-09 17:57:51.060880

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8756456a670'
down_revision: Union[str, None] = '2cad016e54de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create cart_items table
    op.create_table(
        'cart_items',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.CheckConstraint('quantity > 0', name='cart_items_quantity_positive'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_cart_items_user_product')
    )
    
    # Create index on user_id for faster cart lookups
    op.create_index('idx_cart_items_user', 'cart_items', ['user_id'])


def downgrade() -> None:
    # Drop index first
    op.drop_index('idx_cart_items_user', table_name='cart_items')
    
    # Drop cart_items table
    op.drop_table('cart_items')
