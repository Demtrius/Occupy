# Generated by Django 3.2.13 on 2022-07-28 07:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0022_auto_20220629_1120'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='occupier',
            name='dob',
        ),
        migrations.AlterField(
            model_name='occupier',
            name='date_joined',
            field=models.DateField(auto_now_add=True, verbose_name='date joined'),
        ),
    ]
