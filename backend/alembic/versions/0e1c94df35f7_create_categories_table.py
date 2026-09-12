"""create_categories_table

Creates the categories table with the following features:
- UUID primary key with auto-generation
- Name with UNIQUE constraint
- Slug with UNIQUE constraint
- Optional description field
- One index for performance: idx_categories_slug

This migration depends on the orders table (migration 7a3c33910e7a).
The products table (migration 2cad016e54de) depends on this table.

Revision ID: 0e1c94df35f7
Revises: 7a3c33910e7a
Create Date: 2026-09-09 18:37:53.254291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e1c94df35f7'
down_revision: Union[str, None] = '7a3c33910e7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id', name='categories_pkey'),
        sa.UniqueConstraint('name', name='categories_name_key'),
        sa.UniqueConstraint('slug', name='categories_slug_key')
    )
    
    # Create index for performance optimization
    op.create_index('idx_categories_slug', 'categories', ['slug'])


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_categories_slug', table_name='categories')
    
    # Drop table
    op.drop_table('categories')
