# Generated by Django 3.2 on 2023-07-24 18:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0036_alter_post_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='clique',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posts', to='Occupy.clique'),
        ),
        migrations.AlterUniqueTogether(
            name='clique',
            unique_together=set(),
        ),
    ]