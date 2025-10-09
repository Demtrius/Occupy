"""
Import all views from modular files.
"""

from .post import (
    PostListApi,
    PostUpdateApi,
    PostDeleteApi,
    PostLikeApi,
    PostCommentsApi,
    PostAddCommentApi,
    PostFeedApi,
    CommentUpdateApi,
    CommentDeleteApi,
)
# from .clique import CliqueViewSet
# from .service import ServiceViewSet
# from .availability import AvailabilityViewSet
# from .booking import BookingViewSet
# from .review import ReviewViewSet

__all__ = [
    "PostListApi",
    "PostUpdateApi",
    "PostDeleteApi",
    "PostLikeApi",
    "PostCommentsApi",
    "PostAddCommentApi",
    "PostFeedApi",
    "CommentUpdateApi",
    "CommentDeleteApi",
    # "CliqueViewSet",
    # "ServiceViewSet",
    # "AvailabilityViewSet",
    # "BookingViewSet",
    # "ReviewViewSet",
]