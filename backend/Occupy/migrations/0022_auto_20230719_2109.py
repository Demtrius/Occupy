# Generated by Django 3.2.13 on 2023-07-19 21:09

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Occupy', '0021_auto_20230719_2058'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clique',
            name='occupants',
        ),
        migrations.AddField(
            model_name='clique',
            name='occupiers',
            field=models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL),
        ),
    ]
