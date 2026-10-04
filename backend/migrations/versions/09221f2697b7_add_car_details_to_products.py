"""add_car_details_to_products

Revision ID: 09221f2697b7
Revises: 43f7c8228066
Create Date: 2026-09-12 15:26:48.470959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09221f2697b7'
down_revision: Union[str, None] = '43f7c8228066'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('color', sa.String(length=100), nullable=True))
    op.add_column('products', sa.Column('year', sa.Integer(), nullable=True))
    op.add_column('products', sa.Column('condition', sa.String(length=100), nullable=True))
    op.alter_column('products', 'category_id', existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column('products', 'category_id', existing_type=sa.UUID(), nullable=False)
    op.drop_column('products', 'condition')
    op.drop_column('products', 'year')
    op.drop_column('products', 'color')
