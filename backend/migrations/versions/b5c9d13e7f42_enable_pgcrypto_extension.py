"""ensure_pgcrypto_extension

Ensures the PostgreSQL extension required by the existing
``gen_random_uuid()`` defaults is installed for databases that were migrated
before the initial migration enabled it explicitly.

Revision ID: b5c9d13e7f42
Revises: 09221f2697b7
Create Date: 2026-09-12

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'b5c9d13e7f42'
down_revision: Union[str, None] = '09221f2697b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')


def downgrade() -> None:
    # Do not drop a database extension that may be used outside this project.
    pass
