from __future__ import annotations

from uuid import uuid4

import pytest

from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, PostStatus, Privacy, Role
from app.models.post import Comment, Post
from app.schemas.post import CommentCreate
from app.services.posts import get_clique_posts
from tests.factories import create_clique, create_post, create_user
from tests.utils import assert_cursor_page, assert_error, auth_headers


@pytest.mark.asyncio
async def test_create_and_list_posts(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    create_payload = {
        "content": "Weekly update",
        "status": PostStatus.POSTED.value,
    }

    response = await client.post(
        f"/api/v1/posts/cliques/{clique.id}/posts",
        json=create_payload,
        headers=auth_headers(make_token(owner)),
    )
    assert response.status_code == 201
    post = response.json()
    assert post["likes_count"] == 0
    post_id = post["id"]

    stored = await db_session.get(Post, post_id)
    assert stored is not None
    posts, next_cursor = await get_clique_posts(
        db_session, str(clique.id), str(owner.id), None, 10
    )
    assert any(p.id == stored.id for p in posts)
    assert next_cursor is None

    list_resp = await client.get(
        f"/api/v1/posts/cliques/{clique.id}/posts",
        headers=auth_headers(make_token(owner)),
    )
    assert list_resp.status_code == 200
    payload = list_resp.json()
    assert_cursor_page(payload)
    assert payload["items"][0]["id"] == str(post_id)

    outsider = await create_user(db_session)
    await db_session.commit()
    forbidden_create = await client.post(
        f"/api/v1/posts/cliques/{clique.id}/posts",
        json={"content": "hi"},
        headers=auth_headers(make_token(outsider)),
    )
    assert forbidden_create.status_code == 403
    assert_error(forbidden_create, "forbidden")

    missing_clique = await client.post(
        f"/api/v1/posts/cliques/{uuid4()}/posts",
        json=create_payload,
        headers=auth_headers(make_token(owner)),
    )
    assert missing_clique.status_code == 404
    assert_error(missing_clique, "not_found")


@pytest.mark.asyncio
async def test_like_and_unlike_post_service(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    like_resp = await client.post(
        f"/api/v1/posts/{post.id}/like",
        headers=auth_headers(make_token(owner)),
    )
    assert like_resp.status_code == 200
    assert like_resp.json()["likes_count"] == 1

    unlike_resp = await client.delete(
        f"/api/v1/posts/{post.id}/like",
        headers=auth_headers(make_token(owner)),
    )
    assert unlike_resp.status_code == 200
    assert unlike_resp.json()["likes_count"] == 0


@pytest.mark.asyncio
async def test_comments_flow(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    comment_payload = {"body": "Nice post!"}
    comment_resp = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json=comment_payload,
        headers=auth_headers(make_token(owner)),
    )
    assert comment_resp.status_code == 201
    comment_id = comment_resp.json()["id"]

    stored = await db_session.get(Comment, comment_id)
    assert stored is not None and stored.body == comment_payload["body"]

    delete_resp = await client.delete(
        f"/api/v1/posts/comments/{comment_id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_resp.status_code == 204

    bad_comment = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json={"body": "   "},
        headers=auth_headers(make_token(owner)),
    )
    assert bad_comment.status_code == 400


@pytest.mark.asyncio
async def test_private_clique_post_visibility(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    post = await create_post(db_session, clique=clique, author=owner)
    db_session.add(
        CliqueMember(
            clique_id=clique.id,
            user_id=member.id,
            role=Role.MEMBER,
            status=MembershipStatus.JOINED,
        )
    )
    await db_session.commit()

    member_resp = await client.get(
        f"/api/v1/posts/{post.id}",
        headers=auth_headers(make_token(member)),
    )
    assert member_resp.status_code == 200

    outsider_resp = await client.get(
        f"/api/v1/posts/{post.id}",
        headers=auth_headers(make_token(outsider)),
    )
    assert outsider_resp.status_code == 403
    assert_error(outsider_resp, "forbidden")


@pytest.mark.asyncio
async def test_post_update_delete_permissions(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    other = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    post = await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    forbidden_update = await client.patch(
        f"/api/v1/posts/{post.id}",
        json={"content": "Nope"},
        headers=auth_headers(make_token(other)),
    )
    assert forbidden_update.status_code == 403
    assert_error(forbidden_update, "forbidden")

    update_resp = await client.patch(
        f"/api/v1/posts/{post.id}",
        json={"content": "Updated", "status": PostStatus.POSTED.value},
        headers=auth_headers(make_token(owner)),
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["content"] == "Updated"

    delete_resp = await client.delete(
        f"/api/v1/posts/{post.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_resp.status_code == 204

    deleted = await client.get(
        f"/api/v1/posts/{post.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert deleted.status_code == 404
    assert_error(deleted, "not_found")


@pytest.mark.asyncio
async def test_comment_permissions(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    post = await create_post(db_session, clique=clique, author=owner)
    db_session.add(
        CliqueMember(
            clique_id=clique.id,
            user_id=member.id,
            role=Role.MEMBER,
            status=MembershipStatus.JOINED,
        )
    )
    await db_session.commit()

    forbidden_comment = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json={"body": "Hello"},
        headers=auth_headers(make_token(outsider)),
    )
    assert forbidden_comment.status_code == 403
    assert_error(forbidden_comment, "forbidden")

    comment_resp = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json={"body": "Hello"},
        headers=auth_headers(make_token(member)),
    )
    comment_id = comment_resp.json()["id"]

    forbidden_delete = await client.delete(
        f"/api/v1/posts/comments/{comment_id}",
        headers=auth_headers(make_token(outsider)),
    )
    assert forbidden_delete.status_code == 403
    assert_error(forbidden_delete, "forbidden")

    delete_member = await client.delete(
        f"/api/v1/posts/comments/{comment_id}",
        headers=auth_headers(make_token(member)),
    )
    assert delete_member.status_code == 204

    missing_comment = await client.delete(
        f"/api/v1/posts/comments/{comment_id}",
        headers=auth_headers(make_token(member)),
    )
    assert missing_comment.status_code == 404
    assert_error(missing_comment, "not_found")

    member_comment = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json={"body": "Hello"},
        headers=auth_headers(make_token(member)),
    )
    assert member_comment.status_code == 201
    comment_id = member_comment.json()["id"]

    invalid_parent = await client.post(
        f"/api/v1/posts/{post.id}/comments",
        json={"body": "Error", "parent_comment_id": str(uuid4())},
        headers=auth_headers(make_token(member)),
    )
    assert invalid_parent.status_code == 400

    owner_delete = await client.delete(
        f"/api/v1/posts/comments/{comment_id}",
        headers=auth_headers(make_token(owner)),
    )
    assert owner_delete.status_code == 204


@pytest.mark.asyncio
async def test_list_private_clique_posts_requires_membership(
    client, db_session, make_token
):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/posts/cliques/{clique.id}/posts",
        headers=auth_headers(make_token(outsider)),
    )
    assert response.status_code == 403
    assert_error(response, "forbidden")


@pytest.mark.asyncio
async def test_get_post_not_found(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/posts/{uuid4()}",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")
