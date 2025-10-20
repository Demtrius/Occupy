from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OccupationBase(BaseModel):
    name: str
    slug: str


class OccupationCreate(OccupationBase):
    pass


class OccupationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None


class Occupation(OccupationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID