from rest_framework import serializers
from Occupier.models import Occupier
from Occupy.models import Clique, Post, CommentPost
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=65, min_length=8, write_only=True)

    class Meta:
        model = Occupier
        fields = ("username", "email", "occupations", "password")

    def create(self, validated_data):
        return Occupier.objects.create_user(**validated_data)


class LoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, min_length=6, write_only=True)

    class Meta:
        model = Occupier
        fields = ("email", "password", "token")
        read_only_fields = ["token"]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)

    def validate(self, attrs):
        # Allow authentication with either email or username
        email = attrs.get("email")
        username = attrs.get("username")
        password = attrs.get("password")

        if not password:
            raise serializers.ValidationError("Password is required")

        # If email is provided, find the username
        if email and not username:
            try:
                occupier = Occupier.objects.get(email=email)
                attrs["username"] = occupier.username
            except Occupier.DoesNotExist:
                raise serializers.ValidationError("No account found with this email")
        elif not email and not username:
            raise serializers.ValidationError("Either email or username is required")

        # Call parent validation with username
        return super().validate(attrs)

    @classmethod
    def get_token(cls, occupier):
        token = super().get_token(occupier)
        token["username"] = occupier.username
        token["email"] = occupier.email
        token["occupations"] = occupier.occupations
        return token


class CommentPostSerializer(serializers.ModelSerializer):
    post = serializers.StringRelatedField(read_only=True)
    occupier = serializers.ReadOnlyField(source="occupier.username")

    class Meta:
        model = CommentPost
        fields = "__all__"


class PostSerializer(serializers.ModelSerializer):
    clique = serializers.ReadOnlyField(source="clique.name")  # Read-only for the name
    clique = serializers.SlugRelatedField(
        queryset=Clique.objects.all(), slug_field="name"
    )  # Use t  # For write operations
    occupier = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "posted",
            "occupier",
            "timestamp",
            "comments",
            "clique",
        ]

    def get_comments(self, obj):
        comments = CommentPost.objects.filter(post=obj)[:3]
        request = self.context.get("request")

        return {
            "comments": CommentPostSerializer(comments, many=True).data,
        }

    def get_occupier(self, obj):
        return obj.occupier.username if obj.occupier else None

    def create(self, validated_data):
        # Automatically associate the authenticated user as the occupier
        validated_data["occupier"] = self.context["request"].user
        return super().create(validated_data)


class CurrentOccupierSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True)

    class Meta:
        model = Occupier
        fields = [
            "id",
            "username",
            "email",
            "occupations",
            "date_joined",
            "posts",
            "followers",
            "cliques",
        ]
