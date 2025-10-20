from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.media import Media


async def register_media(
    db: AsyncSession,
    owner_id: str,
    file_name: str,
    mime_type: str,
    size_bytes: int,
    purpose: str,
) -> Media:
    media = Media(
        owner_id=owner_id,
        file_name=file_name,
        mime_type=mime_type,
        size_bytes=size_bytes,
        purpose=purpose,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def get_media_by_id(db: AsyncSession, media_id: str) -> Media | None:
    return await db.get(Media, media_id)


async def get_user_media(db: AsyncSession, user_id: str, cursor: str | None, limit: int):
    stmt = select(Media).where(Media.owner_id == user_id)
    if cursor:
        stmt = stmt.where(Media.id > cursor)
    stmt = stmt.order_by(Media.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()