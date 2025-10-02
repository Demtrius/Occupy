"""
Serializers for the accounts app.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, BlockedUser


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "occupations",
            "date_of_birth",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": True},
            "occupations": {"required": True},
        }

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        """Create a new user."""
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""

    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, attrs):
        """Validate user credentials."""
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials.")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")
            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include username and password.")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user data."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["username"] = user.username
        token["email"] = user.email
        token["is_business"] = user.is_business_account

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user data to response
        data["user"] = {
            "id": str(self.user.id),
            "username": self.user.username,
            "email": self.user.email,
            "full_name": self.user.full_name,
            "is_business_account": self.user.is_business_account,
        }

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "occupations",
            "bio",
            "location",
            "website",
            "avatar",
            "is_business_account",
            "date_joined",
        ]
        read_only_fields = ["id", "username", "email", "date_joined"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for user information."""

    profile = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "occupations",
            "bio",
            "location",
            "website",
            "avatar",
            "is_business_account",
            "is_private_account",
            "date_joined",
            "profile",
            "followers_count",
            "following_count",
            "posts_count",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "date_joined",
            "followers_count",
            "following_count",
            "posts_count",
        ]

    def get_profile(self, obj):
        """Get user profile data."""
        try:
            return UserProfileDetailSerializer(obj.profile).data
        except UserProfile.DoesNotExist:
            return None

    def get_followers_count(self, obj):
        """Get the number of followers."""
        return getattr(obj, "followers_count", 0)

    def get_following_count(self, obj):
        """Get the number of users being followed."""
        return getattr(obj, "following_count", 0)

    def get_posts_count(self, obj):
        """Get the number of posts."""
        return getattr(obj, "posts_count", 0)


class UserProfileDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed user profile information."""

    class Meta:
        model = UserProfile
        fields = [
            "phone_number",
            "address",
            "social_media_links",
            "preferences",
            "show_email",
            "show_phone",
            "show_location",
        ]


class UserListSerializer(serializers.ModelSerializer):
    """Simplified serializer for user lists."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "occupations",
            "avatar",
            "is_business_account",
        ]


class BlockedUserSerializer(serializers.ModelSerializer):
    """Serializer for blocked users."""

    blocked_user = UserListSerializer(source="blocked", read_only=True)
    blocked_username = serializers.CharField(write_only=True)

    class Meta:
        model = BlockedUser
        fields = ["id", "blocked_user", "blocked_username", "reason", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        """Create a blocked user relationship."""
        blocked_username = validated_data.pop("blocked_username")
        try:
            blocked_user = User.objects.get(username=blocked_username)
        except User.DoesNotExist:
            raise serializers.ValidationError({"blocked_username": "User not found."})

        validated_data["blocked"] = blocked_user
        validated_data["blocker"] = self.context["request"].user

        return super().create(validated_data)
