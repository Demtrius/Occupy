# Generated by Django 3.2 on 2023-07-22 19:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0033_clique_members'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clique',
            name='members',
        ),
    ]