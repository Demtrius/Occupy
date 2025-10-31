"""add read_at to messages

Revision ID: dc06b73b7b71
Revises: 99a929775593
Create Date: 2025-10-30 22:02:29.825858

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc06b73b7b71'
down_revision: Union[str, Sequence[str], None] = '99a929775593'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('read_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    pass
