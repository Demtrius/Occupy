"""add unique constraint for business client chat

Revision ID: 99a929775593
Revises: 51bb101fd1c6
Create Date: 2025-10-30 21:28:08.873728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99a929775593'
down_revision: Union[str, Sequence[str], None] = '51bb101fd1c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove duplicate chats, keeping the one with the smallest id
    op.execute("""
        DELETE FROM chats
        WHERE id NOT IN (
            SELECT DISTINCT ON (business_user_id, client_user_id) id
            FROM chats
            ORDER BY business_user_id, client_user_id, id
        )
    """)
    # Now add the unique constraint
    op.create_unique_constraint(
        "uq_business_client_chat",
        "chats",
        ["business_user_id", "client_user_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_business_client_chat", "chats", type_="unique")
