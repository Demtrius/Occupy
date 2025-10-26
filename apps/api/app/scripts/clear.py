import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.db.base import Base

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)

TABLE_NAMES = [
    table.name
    for table in Base.metadata.sorted_tables
    if table.name != "alembic_version"
]


async def clear() -> None:
    async with engine.begin() as connection:
        if TABLE_NAMES:
            await connection.execute(
                text(f"TRUNCATE {', '.join(TABLE_NAMES)} RESTART IDENTITY CASCADE")
            )
    print("Cleared all tables successfully.")


if __name__ == "__main__":
    response = input(
        "Are you sure you want to clear the database? This action cannot be undone. (y/N): "
    )
    if response.lower() not in ["y", "yes"]:
        print("Operation cancelled.")
        sys.exit(0)
    asyncio.run(clear())
