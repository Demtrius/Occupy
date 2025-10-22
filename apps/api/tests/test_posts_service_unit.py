from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.core.errors import Validation
from app.services.posts import (
    _aggregate_counts,
    _liked_post_ids,
    _parse_cursor,
    create_comment,
    delete_comment,
    like_post,
)
from app.schemas.post import CommentCreate
from tests.factories import create_clique, create_post, create_user


def test_parse_cursor_valid():
    cursor = datetime.now(timezone.utc).isoformat()
    parsed = _parse_cursor(cursor)
    assert parsed.tzinfo is not None


def test_parse_cursor_invalid():
    with pytest.raises(ValueError):
        _parse_cursor("2024-10-10T10:00:00")


@pytest.mark.asyncio
async def test_post_aggregations_and_likes(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    commenter = await create_user(db_session)
    await db_session.commit()

    # Create comment and like to populate counts.
    await create_comment(
        db_session,
        str(post.id),
        str(commenter.id),
        data=CommentCreate(body="Nice!", parent_comment_id=None),
    )
    await like_post(db_session, str(commenter.id), str(post.id))

    likes, comments = await _aggregate_counts(db_session, [post.id])
    assert likes[post.id] == 1
    assert comments[post.id] == 1

    liked_ids = await _liked_post_ids(db_session, [post.id], str(commenter.id))
    assert post.id in liked_ids


@pytest.mark.asyncio
async def test_delete_comment_permissions(db_session):
    owner = await create_user(db_session, is_business_page=True)
    author = await create_user(db_session)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=author)
    await db_session.commit()

    payload = CommentCreate(body="Comment", parent_comment_id=None)
    comment = await create_comment(
        db_session,
        str(post.id),
        str(author.id),
        data=payload,
    )

    # Clique owner can delete another user's comment.
    await delete_comment(db_session, str(comment.id), str(owner.id))

    # Fresh comment for permission failure path.
    second = await create_comment(
        db_session,
        str(post.id),
        str(author.id),
        data=payload,
    )

    with pytest.raises(PermissionError):
        await delete_comment(db_session, str(second.id), str(outsider.id))


@pytest.mark.asyncio
async def test_create_comment_validation(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    empty_payload = CommentCreate(body="   ", parent_comment_id=None)
    with pytest.raises(Validation):
        await create_comment(
            db_session, str(post.id), str(owner.id), data=empty_payload
        )
