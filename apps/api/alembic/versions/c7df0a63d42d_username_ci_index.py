"""Add case-insensitive username unique index"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "c7df0a63d42d"
down_revision = "97fd6734af55"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_ci ON users (LOWER(username));"
    )
    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_no_overlap
        EXCLUDE USING gist (
            clique_id WITH =,
            tstzrange(start_ts, end_ts, '[]') WITH &&
        )
        WHERE (status IN ('PENDING','CONFIRMED'));
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;")
    op.execute("DROP INDEX IF EXISTS uq_users_username_ci;")
