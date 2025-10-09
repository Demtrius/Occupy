"""
Views for Post-related models.
"""

from typing import Any
from rest_framework import status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError

from authentication.backends import CustomJWTAuthentication
from ..models import Post, Like, CommentPost, Clique
from ..serializers import (
    PostListSerializer,
    PostDetailSerializer,
    CommentSerializer,
    LikeSerializer,
    CliqueListSerializer,
)
from ..services import (
    post_create,
    post_update,
    post_delete,
    comment_create,
    comment_update,
    comment_delete,
    like_create,
    like_delete,
)
from ..selectors import (
    post_list,
    post_get,
    post_feed_get,
    comment_list,
    comment_get,
    like_list,
    like_exists,
)


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"


class PostListApi(APIView):
    """
    API for listing and filtering posts.

    GET /api/posts/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]
    authentication_classes = [CustomJWTAuthentication]

    class InputSerializer(serializers.Serializer):
        content = serializers.CharField(max_length=400)
        caption = serializers.CharField(max_length=400)
        clique_id = serializers.IntegerField()
        status = serializers.ChoiceField(choices=["draft", "posted"], default="posted")

        def validate_clique_id(self, value):
            try:
                clique = Clique.objects.get(id=value)
                if not clique.members.filter(
                    id=self.context["request"].user.id
                ).exists():
                    raise serializers.ValidationError(
                        "You must be a member of this clique to post."
                    )
                return value
            except Clique.DoesNotExist:
                raise serializers.ValidationError("Clique does not exist.")

    def get(self, request: Request) -> Response:
        """List posts with pagination."""
        posts = post_list(user=request.user)

        # Paginate
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        if page is not None:
            serializer = PostListSerializer(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = self.InputSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            clique = Clique.objects.get(id=serializer.validated_data["clique_id"])
            post = post_create(
                occupier=request.user,
                clique=clique,
                content=serializer.validated_data["content"],
                caption=serializer.validated_data["caption"],
                status=serializer.validated_data.get("status", "posted"),
            )
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = PostDetailSerializer(post, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class PostUpdateApi(APIView):
    """
    API for updating posts.

    POST /api/posts/<id>/update/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    class InputSerializer(serializers.Serializer):
        content = serializers.CharField(max_length=400, required=False)
        caption = serializers.CharField(max_length=400, required=False)
        status = serializers.ChoiceField(choices=["draft", "posted"], required=False)

    def patch(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Check ownership
        if post.occupier != request.user:
            return Response(
                {"detail": "You can only update your own posts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # , partial=True

        try:
            post = post_update(post=post, **serializer.validated_data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = PostDetailSerializer(post, context={"request": request})
        return Response(output_serializer.data)

    def put(self, request: Request, id: int) -> Response:
        return self.patch(request, id)


class PostDeleteApi(APIView):
    """
    API for deleting posts.

    DELETE /api/posts/<id>/delete/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def delete(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Check ownership
        if post.occupier != request.user:
            return Response(
                {"detail": "You can only delete your own posts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        post_delete(post=post)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostLikeApi(APIView):
    """
    API for liking/unliking posts.

    POST, DELETE /api/posts/<id>/like/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def post(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            like_create(post=post, user=request.user)
            likes_count = Like.objects.filter(post=post).count()
            return Response(
                {
                    "likesCount": likes_count,
                    "isLiked": True,
                    "detail": "Post liked successfully."
                },
                status=status.HTTP_201_CREATED
            )
        except ValidationError:
            likes_count = Like.objects.filter(post=post).count()
            return Response(
                {
                    "likesCount": likes_count,
                    "isLiked": True,
                    "detail": "You have already liked this post."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        like_delete(post=post, user=request.user)
        likes_count = Like.objects.filter(post=post).count()
        return Response({
            "likesCount": likes_count,
            "isLiked": False,
            "detail": "Post unliked successfully."
        })


class PostCommentsApi(APIView):
    """
    API for getting post comments.

    GET /api/posts/<id>/comments/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        comments = comment_list(post=post)
        serializer = CommentSerializer(
            comments, many=True, context={"request": request}
        )
        return Response(serializer.data)


class PostAddCommentApi(APIView):
    """
    API for adding comments to posts.

    POST /api/posts/<id>/add-comment/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    class InputSerializer(serializers.Serializer):
        content = serializers.CharField()

    def post(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            comment = comment_create(
                post=post,
                occupier=request.user,
                body=serializer.validated_data["content"],
            )
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = CommentSerializer(comment, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class PostFeedApi(APIView):
    """
    API for getting personalized post feed.

    GET /api/posts/feed/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request: Request) -> Response:
        posts = post_feed_get(user=request.user)

        # Paginate
        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request)
        if page is not None:
            serializer = PostListSerializer(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)


class PostDetailApi(APIView):
    """
    API for getting a single post detail.

    GET /api/posts/<id>/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request: Request, id: int) -> Response:
        post = post_get(id=id, user=request.user)
        if not post:
            return Response(
                {"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = PostDetailSerializer(post, context={"request": request})
        return Response(serializer.data)


# Alias for backward compatibility
PostCreateApi = PostListApi

# Comment APIs
class CommentUpdateApi(APIView):
    """
    API for updating comments.

    PATCH /api/comments/<id>/update/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    class InputSerializer(serializers.Serializer):
        content = serializers.CharField()

    def patch(self, request: Request, id: int) -> Response:
        comment = comment_get(id=id)
        if not comment:
            return Response(
                {"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if comment.occupier != request.user:
            return Response(
                {"detail": "You can only update your own comments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            comment = comment_update(
                comment=comment, body=serializer.validated_data["content"]
            )
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = CommentSerializer(comment, context={"request": request})
        return Response(output_serializer.data)

    def put(self, request: Request, id: int) -> Response:
        return self.patch(request, id)


class CommentDeleteApi(APIView):
    """
    API for deleting comments.

    DELETE /api/comments/<id>/delete/
    """

    tags = ["Posts"]
    serializer_class = serializers.Serializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    def delete(self, request: Request, id: int) -> Response:
        comment = comment_get(id=id)
        if not comment:
            return Response(
                {"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if comment.occupier != request.user:
            return Response(
                {"detail": "You can only delete your own comments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        comment_delete(comment=comment)
        return Response(status=status.HTTP_204_NO_CONTENT)
