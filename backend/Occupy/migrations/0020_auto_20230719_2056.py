# Generated by Django 3.2.13 on 2023-07-19 20:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Occupy', '0019_auto_20230719_2033'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='clique',
            options={'ordering': ['-created_at'], 'verbose_name': 'Clique', 'verbose_name_plural': 'Cliques'},
        ),
        migrations.AddField(
            model_name='clique',
            name='occupants',
            field=models.ManyToManyField(blank=True, related_name='occupants', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='clique',
            name='occupier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cliques', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='clique',
            unique_together={('name', 'occupation')},
        ),
        migrations.DeleteModel(
            name='CliqueMember',
        ),
    ]