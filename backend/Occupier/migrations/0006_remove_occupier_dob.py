# Generated by Django 3.0.7 on 2021-11-16 20:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0005_auto_20211116_2032'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='occupier',
            name='dob',
        ),
    ]