# Enums
from enum import Enum


class ContentFormat(str, Enum):
    MARKDOWN = "markdown"


class FollowStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class Privacy(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class Role(str, Enum):
    OWNER = "owner"
    MEMBER = "member"


class MembershipStatus(str, Enum):
    JOINED = "joined"
    PENDING = "pending"
    BANNED = "banned"


class PostStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    ARCHIVED = "archived"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CancelledBy(str, Enum):
    OWNER = "owner"
    CLIENT = "client"


class NotificationType(str, Enum):
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    BOOKING_REQUEST = "booking_request"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_CANCELLED = "booking_cancelled"
    REVIEW = "review"
    SYSTEM = "system"
    MESSAGE = "message"
