# Generated by Django 3.2.13 on 2023-06-28 19:25

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0013_auto_20230628_0911'),
    ]

    operations = [
        migrations.AddField(
            model_name='clique',
            name='posts',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='posts', to='Occupy.post'),
        ),
    ]
