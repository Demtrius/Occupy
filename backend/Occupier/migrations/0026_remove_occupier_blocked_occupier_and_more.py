# Generated by Django 5.0.6 on 2024-09-18 10:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0025_alter_occupier_blocked_occupier'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='occupier',
            name='blocked_occupier',
        ),
        migrations.RemoveField(
            model_name='occupier',
            name='followers',
        ),
        migrations.RemoveField(
            model_name='occupier',
            name='following',
        ),
        migrations.RemoveField(
            model_name='occupier',
            name='pending_request',
        ),
    ]
