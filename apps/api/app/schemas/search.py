from typing import List

from app.schemas.base import BaseSchema

from .clique import Clique
from .occupation import Occupation
from .user import User


class SearchResult(BaseSchema):
    users: List[User]
    occupations: List[Occupation]
    cliques: List[Clique]
