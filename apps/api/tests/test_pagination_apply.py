from __future__ import annotations

import pytest
from sqlalchemy import select

from app.core.pagination import apply_datetime_cursor, encode_datetime_cursor
from app.models.post import Post
from tests.factories import create_clique, create_post, create_user


@pytest.mark.asyncio
async def test_apply_datetime_cursor_filters(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    posts = []
    for _ in range(3):
        posts.append(await create_post(db_session, clique=clique, author=owner))
    await db_session.commit()

    cursor = encode_datetime_cursor(posts[1].created_at, posts[1].id)
    stmt = select(Post).where(Post.clique_id == clique.id)
    stmt = apply_datetime_cursor(stmt, Post, cursor, limit=5)
    result = await db_session.execute(stmt)
    rows = result.scalars().all()
    assert all(row.created_at <= posts[1].created_at for row in rows)
