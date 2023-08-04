# Generated by Django 3.2.13 on 2023-07-18 13:26

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Occupy', '0015_auto_20230629_0856'),
    ]

    operations = [
        migrations.CreateModel(
            name='TagType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=15)),
            ],
            options={
                'verbose_name': 'Tag Type',
                'verbose_name_plural': 'Tag Types',
            },
        ),
        migrations.AddField(
            model_name='clique',
            name='description',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='clique',
            name='level',
            field=models.CharField(choices=[('PUBLIC', 'Public'), ('PRIVATE', 'Private')], default='PUBLIC', help_text='  \n        Public: Any user can join a public clique\n        Private: Requires an invite to join clique\n        ', max_length=15),
        ),
        migrations.AlterField(
            model_name='post',
            name='occupier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='posts', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('tag_type', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tags', to='Occupy.tagtype', verbose_name='tag type')),
            ],
            options={
                'verbose_name': 'Tag',
                'verbose_name_plural': 'Tags',
            },
        ),
    ]