# Generated by Django 3.2.13 on 2023-09-22 07:55

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Occupy', '0040_remove_comment_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comment',
            name='occupier',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='comments_authored', to=settings.AUTH_USER_MODEL),
        ),
    ]
