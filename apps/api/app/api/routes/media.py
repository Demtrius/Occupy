from fastapi import APIRouter, Body, Depends, Query, status
from pydantic import AliasChoices
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import Validation
from ...models.user import User
from ...schemas.media import MediaCreate, MediaPresignResponse, MediaRegisterResponse
from ...services.media import generate_presigned_upload, register_media

router = APIRouter(prefix="/api/v1/media", tags=["Media"])


@router.post(
    "/uploads/presign",
    operation_id="MediaUploadsPresign",
    summary="Generate presigned upload",
    description="Return a presigned URL and required form fields for direct uploads.",
    response_model=MediaPresignResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Presign generated",
            "content": {
                "application/json": {
                    "example": {
                        "method": "PUT",
                        "uploadUrl": "https://s3.amazonaws.com/bucket/uploads",
                        "publicUrl": "https://cdn.example.com/bucket/uploads",
                        "expiresIn": 900,
                    }
                }
            },
        },
        **error_responses(400, 401, 422),
    },
    openapi_extra=secured(),
)
async def presign_upload(
    mime: str = Query(
        ...,
        validation_alias=AliasChoices("mimeType", "mime"),
        serialization_alias="mimeType",
        description="MIME type of the file to be uploaded.",
    ),
    size_bytes: int = Query(
        ...,
        alias="sizeBytes",
        description="Planned upload size in bytes.",
        ge=1,
    ),
    purpose: str = Query(
        ...,
        description="Purpose of the media (e.g. `profile`, `gallery`, `attachment`).",
    ),
    current_user: User = Depends(require_active_user),
):
    try:
        return generate_presigned_upload(purpose, mime, size_bytes)
    except ValueError as exc:
        raise Validation(str(exc))


@router.post(
    "",
    operation_id="MediaRegister",
    summary="Register uploaded media",
    description="Persist uploaded media metadata after a successful presigned upload.",
    response_model=MediaRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Media registered",
            "content": {
                "application/json": {
                    "example": {"mediaId": "28c77070-40a9-4478-b6a6-319d1490d0dd"}
                }
            },
        },
        **error_responses(400, 401, 422),
    },
    openapi_extra=secured(),
)
async def register_uploaded(
    data: MediaCreate = Body(
        ...,
        examples={
            "stored": {
                "summary": "Uploaded image metadata",
                "value": {
                    "url": "https://cdn.example.com/uploads/media/2024/04/02/b19fd.png",
                    "mime": "image/png",
                    "size_bytes": 482301,
                    "meta": {"role": "profile"},
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
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
    return {"media_id": str(media.id)}
