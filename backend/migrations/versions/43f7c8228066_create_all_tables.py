"""create_all_tables

Creates all database tables for CAR COLLECTORS e-commerce platform in the correct order:
1. categories
2. users
3. products (depends on categories)
4. cart_items (depends on users, products)
5. orders (depends on users)
6. order_items (depends on orders, products)
7. delivery_addresses (depends on orders)

Revision ID: 43f7c8228066
Revises: 
Create Date: 2026-09-10 12:27:27.362761

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '43f7c8228066'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('slug')
    )
    op.create_index('idx_categories_slug', 'categories', ['slug'])
    
    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('mobile', sa.String(length=20), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('TRUE'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint("role IN ('ADMIN', 'CUSTOMER')"),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])
    
    # 3. Create products table
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
        sa.CheckConstraint('price >= 0'),
        sa.CheckConstraint('stock_quantity >= 0'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_products_brand', 'products', ['brand'])
    op.create_index('idx_products_series', 'products', ['series'])
    op.create_index('idx_products_category', 'products', ['category_id'])
    op.create_index('idx_products_price', 'products', ['price'])
    op.create_index('idx_products_is_active', 'products', ['is_active'])
    op.create_index('idx_products_created_at', 'products', [sa.text('created_at DESC')])
    
    # 4. Create cart_items table
    op.create_table(
        'cart_items',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint('quantity > 0'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'product_id')
    )
    op.create_index('idx_cart_items_user', 'cart_items', ['user_id'])
    
    # 5. Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.CheckConstraint("status IN ('PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')"),
        sa.CheckConstraint('total_amount >= 0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_number')
    )
    op.create_index('idx_orders_user', 'orders', ['user_id'])
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_created_at', 'orders', [sa.text('created_at DESC')])
    op.create_index('idx_orders_order_number', 'orders', ['order_number'])
    
    # 6. Create order_items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.CheckConstraint('quantity > 0'),
        sa.CheckConstraint('unit_price >= 0'),
        sa.CheckConstraint('subtotal >= 0'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_order_items_order', 'order_items', ['order_id'])
    
    # 7. Create delivery_addresses table
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
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_delivery_addresses_order', 'delivery_addresses', ['order_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('idx_delivery_addresses_order', table_name='delivery_addresses')
    op.drop_table('delivery_addresses')
    
    op.drop_index('idx_order_items_order', table_name='order_items')
    op.drop_table('order_items')
    
    op.drop_index('idx_orders_order_number', table_name='orders')
    op.drop_index('idx_orders_created_at', table_name='orders')
    op.drop_index('idx_orders_status', table_name='orders')
    op.drop_index('idx_orders_user', table_name='orders')
    op.drop_table('orders')
    
    op.drop_index('idx_cart_items_user', table_name='cart_items')
    op.drop_table('cart_items')
    
    op.drop_index('idx_products_created_at', table_name='products')
    op.drop_index('idx_products_is_active', table_name='products')
    op.drop_index('idx_products_price', table_name='products')
    op.drop_index('idx_products_category', table_name='products')
    op.drop_index('idx_products_series', table_name='products')
    op.drop_index('idx_products_brand', table_name='products')
    op.drop_table('products')
    
    op.drop_index('idx_users_role', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
    
    op.drop_index('idx_categories_slug', table_name='categories')
    op.drop_table('categories')

