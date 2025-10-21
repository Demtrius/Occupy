from __future__ import annotations

import pytest

from app.models.enums import PostStatus
from app.models.post import Post
from app.services.posts import get_clique_posts
from tests.factories import create_clique, create_post, create_user
from tests.utils import auth_headers


@pytest.mark.asyncio
async def test_create_and_list_posts(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    payload = {
        "content": "Weekly update",
        "status": PostStatus.POSTED.value,
    }

    response = await client.post(
        f"/api/v1/posts/cliques/{clique.id}/posts",
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert response.status_code == 200
    post_id = response.json()["id"]

    stored = await db_session.get(Post, post_id)
    assert stored is not None
    posts = await get_clique_posts(db_session, str(clique.id), None, 10)
    assert any(post.id == stored.id for post in posts)


@pytest.mark.asyncio
async def test_like_and_unlike_post_service(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    from app.services.posts import like_post, unlike_post
    from app.models.post import PostLike

    await like_post(db_session, str(owner.id), str(post.id))
    like = await db_session.get(PostLike, (post.id, owner.id))
    assert like is not None

    await unlike_post(db_session, str(owner.id), str(post.id))
    like_after = await db_session.get(PostLike, (post.id, owner.id))
    assert like_after is None
