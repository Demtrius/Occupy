# Generated by Django 3.2.13 on 2022-06-29 11:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0021_auto_20220424_2252'),
    ]

    operations = [
        migrations.AlterField(
            model_name='occupier',
            name='dob',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='occupier',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
