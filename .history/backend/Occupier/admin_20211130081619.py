from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from Occupier.models import Occupier
# Register your models here.


class OccupierAdmin(userAdmin):
    list_display = ('email','username','date_joined','last_login','is_admin','is_staff')
    search_fields = ('username','email')
    readonly_fields = ('date_joined','last_login')

filter_horizontal = ()
list_filter = ()
fieldsets = ()

admin.site.register(Occupier,OccupierAdmin)