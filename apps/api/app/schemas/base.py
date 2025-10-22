from pydantic import BaseModel, ConfigDict


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class BaseSchema(BaseModel):
    """
    - Serializes with camelCase via alias_generator
    - Accepts both snake_case and camelCase inputs (populate_by_name=True)
    - Supports ORM -> DTO via from_attributes=True
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        str_strip_whitespace=True,
    )
