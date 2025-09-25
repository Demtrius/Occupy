"""
Custom permissions for the social app.
"""

from rest_framework import permissions
from .models import CliqueMembership


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the author of the object.
        return obj.author == request.user


class IsCliqueMemberOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow clique members to write.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to clique members.
        clique = getattr(obj, "clique", obj)
        return clique.members.filter(id=request.user.id).exists()


class IsCliqueAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow clique admins to edit clique settings.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to clique creator or admins.
        if obj.creator == request.user:
            return True

        try:
            membership = CliqueMembership.objects.get(user=request.user, clique=obj)
            return membership.role in ["admin", "moderator"]
        except CliqueMembership.DoesNotExist:
            return False


class IsCliqueMember(permissions.BasePermission):
    """
    Custom permission to only allow clique members to access content.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        clique = getattr(obj, "clique", obj)

        # Public cliques are accessible to everyone
        if clique.privacy_level == "public":
            return True

        # Private cliques require membership
        return clique.members.filter(id=request.user.id).exists()


class CanJoinClique(permissions.BasePermission):
    """
    Custom permission to check if a user can join a clique.
    """

    def has_object_permission(self, request, view, obj):
        # Can't join if already a member
        if obj.members.filter(id=request.user.id).exists():
            return False

        # Public cliques can be joined by anyone
        if obj.privacy_level == "public":
            return True

        # Private and invite-only cliques have restrictions
        return False
