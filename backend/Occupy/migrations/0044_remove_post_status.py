# Generated by Django 5.0.6 on 2024-08-04 20:05

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0043_commentpost'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='status',
        ),
    ]
