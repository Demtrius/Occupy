# Generated by Django 3.2 on 2023-07-24 13:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0035_auto_20230723_1919'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='post',
            options={'ordering': ['-posted']},
        ),
    ]