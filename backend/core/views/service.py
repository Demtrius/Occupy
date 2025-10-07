"""
Views for Service and Availability models.
"""

from rest_framework import status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from django.core.exceptions import ValidationError

from ..models import Clique
from ..selectors import service_list, service_get
from ..services import service_create, service_update
from ..serializers.service import (
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServiceCreateUpdateSerializer,
)
from .post import PostPagination


class ServiceListCreateApi(APIView):
    """
    API for listing and creating services.

    GET /api/services/
    POST /api/services/
    """

    permission_classes = [permissions.IsAuthenticated]

    class FilterSerializer(serializers.Serializer):
        clique = serializers.IntegerField(required=False)
        provider = serializers.IntegerField(required=False)
        is_active = serializers.BooleanField(required=False)

    def get(self, request: Request) -> Response:
        filter_serializer = self.FilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)

        services = service_list(filters=filter_serializer.validated_data)

        paginator = PostPagination()
        page = paginator.paginate_queryset(services, request)
        if page is not None:
            serializer = ServiceListSerializer(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = ServiceListSerializer(
            services, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = ServiceCreateUpdateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            clique = Clique.objects.get(id=serializer.validated_data["clique_id"])
            service = service_create(
                provider=request.user, clique=clique, **serializer.validated_data
            )
        except (ValidationError, Clique.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = ServiceDetailSerializer(service)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class ServiceRetrieveUpdateDestroyApi(APIView):
    """
    API for retrieving, updating, and deleting a service.

    GET /api/services/<id>/
    PATCH /api/services/<id>/
    DELETE /api/services/<id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, id: int) -> Response:
        service = service_get(id=id, user=request.user)
        if not service:
            return Response(
                {"detail": "Service not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ServiceDetailSerializer(service)
        return Response(serializer.data)

    def patch(self, request: Request, id: int) -> Response:
        service = service_get(id=id, user=request.user)
        if not service or service.provider != request.user:
            return Response(
                {"detail": "Service not found or permission denied."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ServiceCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_service = service_update(
            service=service, data=serializer.validated_data
        )
        output_serializer = ServiceDetailSerializer(updated_service)
        return Response(output_serializer.data)

    def delete(self, request: Request, id: int) -> Response:
        service = service_get(id=id, user=request.user)
        if not service or service.provider != request.user:
            return Response(
                {"detail": "Service not found or permission denied."},
                status=status.HTTP_404_NOT_FOUND,
            )
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
