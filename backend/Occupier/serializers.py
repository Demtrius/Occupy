from rest_framework import serializers
from .models import Occupier
from Occupy.serializers import FollowSerializer


class OccupierSerializer(serializers.ModelSerializer):
    following = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()

    class Meta:
        model = Occupier
        fields = [
            "username",
            "id",
            "occupations",
            "date_joined",
            "following",
            "followers",
        ]

    def get_following(self, obj):
        return FollowSerializer(obj.following.all(), many=True).data

    def get_followers(self, obj):
        return FollowSerializer(obj.followers.all(), many=True).data


class EachOccupierSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="occupier.username")

    class Meta:
        model = Occupier
        fields = ("id", "username")
