from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...models.user import User
from ...schemas.media import MediaCreate
from ...services.media import register_media

router = APIRouter(prefix="/media", tags=["Media"])


@router.post("/uploads/presign", response_model=dict)
async def presign_upload(
    mime: str,
    size_bytes: int,
    purpose: str,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Generate presigned URL using MinIO
    return {"method": "PUT", "upload_url": "https://example.com", "expires_in": 3600}


@router.post("", response_model=dict)
async def register_uploaded(
    data: MediaCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    media = await register_media(
        db,
        str(current_user.id),
        data.url,
        data.mime,
        data.size_bytes,
        data.meta,
    )
    return {"media_id": media.id}
