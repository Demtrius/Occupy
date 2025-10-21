from typing import List

from pydantic import BaseModel

from .clique import Clique
from .occupation import Occupation
from .user import User


class SearchResult(BaseModel):
    users: List[User]
    occupations: List[Occupation]
    cliques: List[Clique]