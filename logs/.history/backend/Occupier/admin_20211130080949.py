from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from Occupier.models import Occupier
# Register your models here.
admin.site.register(Occupier)

class OccupierAdmin(userAdmin):
    list_display = ('email','username','date_joined','last_login','is_admin','is_staff')
    search_fields = ()