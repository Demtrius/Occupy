# Generated by Django 3.0.7 on 2021-11-17 16:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0012_auto_20211117_1622'),
    ]

    operations = [
        migrations.AlterField(
            model_name='occupier',
            name='password',
            field=models.CharField(max_length=59, unique=True),
        ),
    ]