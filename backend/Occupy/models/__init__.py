from backend import Occupier
from .clique import Clique
from .post import Post, CommentPost
from .follow import Follow
from .review import Review

__all__ = ["Clique", "Post", "CommentPost", "Follow", "Review"]


class Service(models.Model):
    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="services"
    )
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)

    def __str__(self):
        return f"{self.title} by {self.provider.username}"


class Availability(models.Model):
    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="availability"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.provider.username} available {self.date} {self.start_time}-{self.end_time}"


class Booking(models.Model):
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="bookings"
    )
    client = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="bookings"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.username} booked {self.service.title} with {self.service.provider.username}"
