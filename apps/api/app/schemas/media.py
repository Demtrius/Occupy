from typing import Any, Dict, Literal, Optional
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.schemas.base import BaseSchema


class MediaCreate(BaseSchema):
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None


class Media(BaseSchema):
    id: UUID
    owner_user_id: UUID
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None


class MediaPresignResponse(BaseModel):
    method: Literal["PUT"] = "PUT"
    upload_url: str = Field(
        alias="uploadUrl",
        validation_alias=AliasChoices("uploadUrl", "upload_url"),
    )
    public_url: str = Field(
        alias="publicUrl",
        validation_alias=AliasChoices("publicUrl", "public_url"),
    )
    expires_in: int = Field(
        alias="expiresIn",
        validation_alias=AliasChoices("expiresIn", "expires_in"),
    )

    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class MediaRegisterResponse(BaseSchema):
    media_id: str = Field(
        alias="mediaId",
        validation_alias=AliasChoices("mediaId", "media_id"),
    )

    model_config = ConfigDict(populate_by_name=True)
