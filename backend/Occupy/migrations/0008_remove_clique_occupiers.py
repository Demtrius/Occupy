# Generated by Django 3.2.13 on 2022-08-14 17:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0007_rename_members_clique_occupiers'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clique',
            name='occupiers',
        ),
    ]
