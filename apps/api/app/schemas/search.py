from typing import List

from pydantic import BaseModel

from .clique import CliqueRead
from .occupation import Occupation
from .user import UserRead


class SearchResult(BaseModel):
    users: List[UserRead]
    occupations: List[Occupation]
    cliques: List[CliqueRead]