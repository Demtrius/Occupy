from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from sqlalchemy import update

from app.api.routes import posts as posts_routes
from app.core.errors import Forbidden, NotFound, Validation
from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, PostStatus, Privacy, Role
from app.models.post import Comment
from app.schemas import CommentCreate
from app.schemas.post import PostCreate, PostUpdate
from tests.factories import (
    create_clique,
    create_comment,
    create_media,
    create_post,
    create_user,
)


@pytest.mark.asyncio
async def test_create_post_route_requires_membership(db_session):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    with pytest.raises(Forbidden):
        await posts_routes.create_post_route(
            clique.id,
            PostCreate(content="hello", status=PostStatus.POSTED),
            outsider,
            db_session,
        )


@pytest.mark.asyncio
async def test_create_post_route_allows_member(db_session):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    db_session.add(
        CliqueMember(
            clique_id=clique.id,
            user_id=member.id,
            role=Role.MEMBER,
            status=MembershipStatus.JOINED,
        )
    )
    await db_session.commit()

    post = await posts_routes.create_post_route(
        clique.id,
        PostCreate(content="hello", status=PostStatus.POSTED),
        member,
        db_session,
    )

    assert post.author_user_id == member.id
    assert post.clique_id == clique.id


@pytest.mark.asyncio
async def test_create_post_route_attaches_media(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    media = await create_media(db_session, owner=owner)
    await db_session.commit()

    post = await posts_routes.create_post_route(
        clique.id,
        PostCreate(
            content="Weekend schedule update",
            status=PostStatus.POSTED,
            media_ids=[media.id],
        ),
        owner,
        db_session,
    )

    assert post.media
    assert post.media[0].media_id == media.id
    assert post.media[0].media.url


@pytest.mark.asyncio
async def test_create_post_route_rejects_foreign_media(db_session):
    owner = await create_user(db_session, is_business_page=True)
    other_user = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    media = await create_media(db_session, owner=other_user)
    await db_session.commit()

    with pytest.raises(Validation):
        await posts_routes.create_post_route(
            clique.id,
            PostCreate(
                content="Cannot reuse media",
                status=PostStatus.POSTED,
                media_ids=[media.id],
            ),
            owner,
            db_session,
        )


@pytest.mark.asyncio
async def test_create_post_route_clique_missing(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    monkeypatch.setattr(
        posts_routes,
        "get_clique_by_id",
        AsyncMock(return_value=None),
    )

    with pytest.raises(NotFound):
        await posts_routes.create_post_route(
            uuid4(),
            PostCreate(content="hello", status=PostStatus.POSTED),
            owner,
            db_session,
        )


@pytest.mark.asyncio
async def test_list_clique_posts_route_private_member_check(db_session):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    with pytest.raises(Forbidden):
        await posts_routes.list_clique_posts_route(
            clique.id,
            outsider,
            cursor=None,
            limit=20,
            db=db_session,
        )


@pytest.mark.asyncio
async def test_list_clique_posts_route_success(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await create_post(db_session, clique=clique, author=owner, status=PostStatus.POSTED)
    await db_session.commit()

    page = await posts_routes.list_clique_posts_route(
        clique.id,
        owner,
        cursor=None,
        limit=10,
        db=db_session,
    )
    assert page.items


@pytest.mark.asyncio
async def test_get_post_route_not_found(db_session):
    user = await create_user(db_session)
    await db_session.commit()

    with pytest.raises(NotFound):
        await posts_routes.get_post_route(uuid4(), user, db_session)


@pytest.mark.asyncio
async def test_update_post_route_allows_clique_owner(db_session):
    owner = await create_user(db_session, is_business_page=True)
    author = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(
        db_session, clique=clique, author=author, status=PostStatus.POSTED
    )
    await db_session.commit()

    updated = await posts_routes.update_post_route(
        post.id,
        PostUpdate(content="Updated content", status=PostStatus.POSTED),
        owner,
        db_session,
    )
    assert updated.content == "Updated content"


@pytest.mark.asyncio
async def test_update_post_route_not_found_after_service(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    monkeypatch.setattr(posts_routes, "update_post", AsyncMock(return_value=None))

    with pytest.raises(NotFound):
        await posts_routes.update_post_route(
            post.id,
            PostUpdate(content="X"),
            owner,
            db_session,
        )


@pytest.mark.asyncio
async def test_like_route_fallback_fetches_post(db_session, monkeypatch):
    user = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=user)
    post = await create_post(db_session, clique=clique, author=user)
    await db_session.commit()

    monkeypatch.setattr(posts_routes, "like_post", AsyncMock(return_value=None))
    sentinel = object()
    monkeypatch.setattr(
        posts_routes, "get_post_by_id", AsyncMock(return_value=sentinel)
    )

    result = await posts_routes.like_route(post.id, user, db_session)
    assert result is sentinel


@pytest.mark.asyncio
async def test_unlike_route_fallback_fetches_post(db_session, monkeypatch):
    user = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=user)
    post = await create_post(db_session, clique=clique, author=user)
    await db_session.commit()

    monkeypatch.setattr(posts_routes, "unlike_post", AsyncMock(return_value=None))
    sentinel = object()
    monkeypatch.setattr(
        posts_routes, "get_post_by_id", AsyncMock(return_value=sentinel)
    )

    result = await posts_routes.unlike_route(post.id, user, db_session)
    assert result is sentinel


@pytest.mark.asyncio
async def test_create_comment_route_validation_error(db_session, monkeypatch):
    user = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=user)
    post = await create_post(db_session, clique=clique, author=user)
    await db_session.commit()

    monkeypatch.setattr(
        posts_routes,
        "create_comment",
        AsyncMock(side_effect=ValueError("invalid")),
    )

    with pytest.raises(Validation):
        await posts_routes.create_comment_route(
            post.id,
            CommentCreate(body="bad"),
            user,
            db_session,
        )


@pytest.mark.asyncio
async def test_delete_comment_route_permission_error(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    author = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=author)
    comment = await create_comment(db_session, post=post, author=author)
    await db_session.commit()

    monkeypatch.setattr(
        posts_routes,
        "delete_comment",
        AsyncMock(side_effect=PermissionError("denied")),
    )

    with pytest.raises(Forbidden):
        await posts_routes.delete_comment_route(
            comment.id,
            owner,
            db_session,
        )


@pytest.mark.asyncio
async def test_delete_comment_route_deleted_comment_not_found(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    comment = await create_comment(db_session, post=post, author=owner)
    await db_session.execute(
        update(Comment)
        .where(Comment.id == comment.id)
        .values(deleted_at=datetime.now(timezone.utc))
    )
    await db_session.refresh(comment)
    await db_session.commit()

    with pytest.raises(NotFound):
        await posts_routes.delete_comment_route(comment.id, owner, db_session)
