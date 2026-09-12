"""create_users_table

Creates the users table with the following features:
- UUID primary key with auto-generation
- Email with UNIQUE constraint
- Password hash for authentication
- User role (ADMIN or CUSTOMER) with CHECK constraint
- Active status flag (default TRUE)
- Two indexes for performance: idx_users_email, idx_users_role

This is the first migration in the database schema.
The orders table (migration 7a3c33910e7a) depends on this table.

Revision ID: aa66435dca01
Revises: 
Create Date: 2026-09-09 17:51:42.186007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa66435dca01'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
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
        sa.CheckConstraint("role IN ('ADMIN', 'CUSTOMER')", name='users_role_check'),
        sa.PrimaryKeyConstraint('id', name='users_pkey'),
        sa.UniqueConstraint('email', name='users_email_key')
    )
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_role', table_name='users')
    
    # Drop table
    op.drop_table('users')
