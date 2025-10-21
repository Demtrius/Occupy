from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.media import Media


async def register_media(
    db: AsyncSession,
    owner_user_id: str,
    url: str,
    mime: str | None,
    size_bytes: int | None,
    meta: dict | None,
) -> Media:
    media = Media(
        owner_user_id=owner_user_id,
        url=url,
        mime=mime,
        size_bytes=size_bytes,
        meta=meta,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def get_media_by_id(db: AsyncSession, media_id: str) -> Media | None:
    return await db.get(Media, media_id)


async def get_user_media(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
):
    stmt = select(Media).where(Media.owner_user_id == user_id)
    if cursor:
        stmt = stmt.where(Media.created_at < cursor)
    stmt = stmt.order_by(Media.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
