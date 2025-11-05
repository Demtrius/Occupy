from sqladmin import ModelView

from app.models import Feedback, User


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.username, User.is_admin, User.is_active]
    column_searchable_list = [User.email, User.username]
    column_sortable_list = [User.id, User.email, User.username]
    icon = "fa-solid fa-user"


class FeedbackAdmin(ModelView, model=Feedback):
    column_list = [
        Feedback.id,
        Feedback.name,
        Feedback.email,
        Feedback.feedback_type,
        Feedback.is_processed,
    ]
    column_searchable_list = [Feedback.name, Feedback.email, Feedback.message]
    column_filters = [Feedback.feedback_type, Feedback.is_processed]
    icon = "fa-solid fa-message"
