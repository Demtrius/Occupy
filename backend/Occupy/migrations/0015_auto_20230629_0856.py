# Generated by Django 3.2.13 on 2023-06-29 08:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0014_clique_posts'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clique',
            name='posts',
        ),
        migrations.AddField(
            model_name='clique',
            name='occupation',
            field=models.CharField(default='', max_length=200),
        ),
    ]