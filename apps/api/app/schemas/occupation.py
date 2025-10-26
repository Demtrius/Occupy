from uuid import UUID

from app.schemas.base import BaseSchema


class OccupationBase(BaseSchema):
    name: str
    slug: str


class OccupationCreate(BaseSchema):
    name: str


class OccupationUpdate(BaseSchema):
    name: str | None = None
    slug: str | None = None


class Occupation(OccupationBase):
    id: UUID
