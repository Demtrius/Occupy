# Generated by Django 3.2 on 2023-06-27 08:41

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Occupy', '0010_auto_20230627_0829'),
    ]

    operations = [
        migrations.AddField(
            model_name='clique',
            name='occupation',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='Occupy.occupation'),
        ),
    ]
