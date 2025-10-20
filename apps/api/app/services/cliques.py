from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.clique import Clique, CliqueMember
from ..models.enums import MembershipStatus, Privacy, Role


async def create_clique(
    db: AsyncSession,
    owner_id: str,
    name: str,
    description: str | None,
    privacy: Privacy,
    occupations: list[str],
) -> Clique:
    clique = Clique(
        owner_id=owner_id,
        name=name,
        description=description,
        privacy=privacy,
    )
    db.add(clique)
    await db.commit()
    await db.refresh(clique)
    # Add occupations
    from ..models.user import Occupation
    for occ_name in occupations:
        occ = await db.scalar(select(Occupation).where(Occupation.name == occ_name))
        if occ:
            clique.occupations.append(occ)
    await db.commit()
    return clique


async def get_clique_by_id(db: AsyncSession, clique_id: str) -> Clique | None:
    return await db.get(Clique, clique_id)


async def join_clique(db: AsyncSession, user_id: str, clique_id: str) -> None:
    clique = await get_clique_by_id(db, clique_id)
    if not clique:
        raise ValueError("Clique not found")

    status = MembershipStatus.PENDING if clique.privacy == Privacy.PRIVATE else MembershipStatus.JOINED
    member = CliqueMember(
        user_id=user_id,
        clique_id=clique_id,
        role=Role.MEMBER,
        status=status,
    )
    db.add(member)
    await db.commit()


async def leave_clique(db: AsyncSession, user_id: str, clique_id: str) -> None:
    stmt = select(CliqueMember).where(
        CliqueMember.user_id == user_id,
        CliqueMember.clique_id == clique_id,
    )
    member = await db.scalar(stmt)
    if member:
        await db.delete(member)
        await db.commit()


async def get_clique_members(db: AsyncSession, clique_id: str, cursor: str | None, limit: int):
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    if cursor:
        stmt = stmt.where(CliqueMember.id > cursor)
    stmt = stmt.order_by(CliqueMember.joined_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_feed_posts(db: AsyncSession, user_id: str, cursor: str | None, limit: int):
    from ..models.post import Post
    from ..models.user import Follow

    # Get followed cliques that are business
    followed_cliques_stmt = select(CliqueMember.clique_id).where(
        CliqueMember.user_id == user_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    followed_clique_ids = await db.scalars(followed_cliques_stmt)
    followed_clique_ids = [cid for cid in followed_clique_ids]

    # Filter to business cliques
    business_cliques_stmt = select(Clique.id).where(
        Clique.id.in_(followed_clique_ids),
        Clique.is_business == True,
    )
    business_clique_ids = await db.scalars(business_cliques_stmt)

    # Get posts from those cliques
    stmt = select(Post).where(Post.clique_id.in_(business_clique_ids))
    if cursor:
        stmt = stmt.where(Post.id > cursor)
    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()