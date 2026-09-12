"""create_products_table

Creates the products table with the following features:
- UUID primary key with auto-generation
- Complete product information (name, brand, series, model, description, scale, material)
- Dual image URLs (front_package_image_url and back_package_image_url) - both NOT NULL
- Foreign key to categories table
- Price CHECK constraint (>= 0)
- Stock quantity CHECK constraint (>= 0)
- Active status flag (default TRUE)
- Six indexes for performance: brand, series, category_id, price, is_active, created_at DESC

NOTE: This migration requires the categories table to exist.
      Ensure Task 5.2 migration is completed before running this migration.

Revision ID: 2cad016e54de
Revises: 0e1c94df35f7
Create Date: 2026-09-09 17:51:34.897775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2cad016e54de'
down_revision: Union[str, None] = '0e1c94df35f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('series', sa.String(length=100), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('scale', sa.String(length=50), nullable=True),
        sa.Column('material', sa.String(length=100), nullable=True),
        sa.Column('front_package_image_url', sa.String(length=500), nullable=False),
        sa.Column('back_package_image_url', sa.String(length=500), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('TRUE')),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint('price >= 0', name='products_price_check'),
        sa.CheckConstraint('stock_quantity >= 0', name='products_stock_quantity_check'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], name='products_category_id_fkey'),
        sa.PrimaryKeyConstraint('id', name='products_pkey')
    )
    
    # Create indexes for performance optimization
    op.create_index('idx_products_brand', 'products', ['brand'])
    op.create_index('idx_products_series', 'products', ['series'])
    op.create_index('idx_products_category', 'products', ['category_id'])
    op.create_index('idx_products_price', 'products', ['price'])
    op.create_index('idx_products_is_active', 'products', ['is_active'])
    op.create_index('idx_products_created_at', 'products', [sa.text('created_at DESC')])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_products_created_at', table_name='products')
    op.drop_index('idx_products_is_active', table_name='products')
    op.drop_index('idx_products_price', table_name='products')
    op.drop_index('idx_products_category', table_name='products')
    op.drop_index('idx_products_series', table_name='products')
    op.drop_index('idx_products_brand', table_name='products')
    
    # Drop table
    op.drop_table('products')
