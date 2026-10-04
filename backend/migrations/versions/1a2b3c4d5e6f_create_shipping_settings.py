"""create shipping settings

Revision ID: 1a2b3c4d5e6f
Revises: 09221f2697b7
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "1a2b3c4d5e6f"
down_revision: Union[str, None] = "09221f2697b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shipping_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("flat_fee", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("free_shipping_threshold", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        "INSERT INTO shipping_settings (id, flat_fee, free_shipping_threshold) VALUES (1, 0, 0)"
    )


def downgrade() -> None:
    op.drop_table("shipping_settings")
