# Generated by Django 3.0.7 on 2022-04-24 22:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0020_alter_occupier_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='occupier',
            name='id',
            field=models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
