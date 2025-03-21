# Generated by Django 5.0.6 on 2024-11-25 07:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Occupier', '0027_businessprofile'),
    ]

    operations = [
        migrations.CreateModel(
            name='BusinessPage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('name', models.CharField(max_length=200)),
                ('bio', models.TextField(blank=True, max_length=500)),
                ('contact_email', models.EmailField(max_length=254)),
                ('occupation', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.DeleteModel(
            name='BusinessProfile',
        ),
    ]
