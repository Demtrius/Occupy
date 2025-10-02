"""
Custom permissions for the accounts app.
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj == request.user


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """

    def has_object_permission(self, request, view, obj):
        return obj == request.user


class IsBusinessAccount(permissions.BasePermission):
    """
    Custom permission to only allow business accounts.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_business_account
        )


class IsNotBlocked(permissions.BasePermission):
    """
    Custom permission to check if the user is not blocked.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return True

        # Check if the object owner has blocked the current user
        if hasattr(obj, "user"):
            return not obj.user.blocked_users.filter(blocked=request.user).exists()

        # If the object is a user, check if they have blocked the current user
        if hasattr(obj, "blocked_users"):
            return not obj.blocked_users.filter(blocked=request.user).exists()

        return True
