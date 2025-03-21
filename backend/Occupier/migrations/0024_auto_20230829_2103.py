# Generated by Django 3.2 on 2023-08-29 21:03

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0023_auto_20220728_0713'),
    ]

    operations = [
        migrations.AddField(
            model_name='occupier',
            name='blocked_occupier',
            field=models.ManyToManyField(blank=True, related_name='_Occupier_occupier_blocked_occupier_+', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='occupier',
            name='followers',
            field=models.ManyToManyField(blank=True, related_name='occupier_followers', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='occupier',
            name='following',
            field=models.ManyToManyField(blank=True, related_name='occupier_following', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='occupier',
            name='pending_request',
            field=models.ManyToManyField(blank=True, related_name='pendingRequest', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='occupier',
            name='private_account',
            field=models.BooleanField(default=False),
        ),
    ]
