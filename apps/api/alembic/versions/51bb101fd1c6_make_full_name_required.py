"""make_full_name_required

Revision ID: 51bb101fd1c6
Revises: c7df0a63d42d
Create Date: 2025-10-26 20:27:35.094800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51bb101fd1c6'
down_revision: Union[str, Sequence[str], None] = 'c7df0a63d42d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, populate any null full_name values with username as fallback
    op.execute("UPDATE users SET full_name = username WHERE full_name IS NULL")
    # Make full_name column required (not nullable)
    op.alter_column('users', 'full_name', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Make full_name column optional again (nullable)
    op.alter_column('users', 'full_name', nullable=True)
