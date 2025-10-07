"""
Views for Booking model.
"""

from rest_framework import status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from django.core.exceptions import ValidationError

from ..models import Service
from ..selectors import booking_list, booking_get
from ..services import (
    booking_create,
    booking_update,
    booking_confirm,
    booking_cancel,
    booking_complete,
)
from ..serializers.booking import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
)
from .post import PostPagination


class BookingListCreateApi(APIView):
    """
    API for listing and creating bookings.
    """

    permission_classes = [permissions.IsAuthenticated]

    class FilterSerializer(serializers.Serializer):
        status = serializers.CharField(required=False)
        date = serializers.DateField(required=False)

    def get(self, request: Request) -> Response:
        filter_serializer = self.FilterSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)

        bookings = booking_list(
            user=request.user, filters=filter_serializer.validated_data
        )

        paginator = PostPagination()
        page = paginator.paginate_queryset(bookings, request)
        if page is not None:
            serializer = BookingListSerializer(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = BookingListSerializer(
            bookings, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            service = Service.objects.get(id=serializer.validated_data["service_id"])
            booking = booking_create(
                client=request.user, service=service, **serializer.validated_data
            )
        except (ValidationError, Service.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        output_serializer = BookingDetailSerializer(booking)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class BookingRetrieveUpdateDestroyApi(APIView):
    """
    API for retrieving, updating, and deleting a booking.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, id: int) -> Response:
        booking = booking_get(id=id, user=request.user)
        if not booking:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    def patch(self, request: Request, id: int) -> Response:
        booking = booking_get(id=id, user=request.user)
        if not booking:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = BookingCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated_booking = booking_update(
            booking=booking, data=serializer.validated_data
        )
        output_serializer = BookingDetailSerializer(updated_booking)
        return Response(output_serializer.data)


class BookingConfirmApi(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, id: int) -> Response:
        booking = booking_get(id=id, user=request.user)
        if not booking:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )
        try:
            confirmed_booking = booking_confirm(booking=booking, user=request.user)
            serializer = BookingDetailSerializer(confirmed_booking)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCancelApi(APIView):
    permission_classes = [permissions.IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        reason = serializers.CharField(required=False, allow_blank=True)

    def post(self, request: Request, id: int) -> Response:
        booking = booking_get(id=id, user=request.user)
        if not booking:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cancelled_booking = booking_cancel(
                booking=booking, user=request.user, **serializer.validated_data
            )
            serializer = BookingDetailSerializer(cancelled_booking)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookingCompleteApi(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, id: int) -> Response:
        booking = booking_get(id=id, user=request.user)
        if not booking:
            return Response(
                {"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )
        try:
            completed_booking = booking_complete(booking=booking, user=request.user)
            serializer = BookingDetailSerializer(completed_booking)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
