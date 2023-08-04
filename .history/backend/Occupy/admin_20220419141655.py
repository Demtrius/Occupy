from django.contrib import admin
from .models import Clique,Post,CliquePost,Comment

# Register your models here.
admin.site.register(Clique)
admin.site.register(Post)
@admin.register(Comment)

class CommentAdmin(admin.ModelAdmin):
    list_display = ('occupier', 'body', 'post', 'created_on')
    list_filter = ('active','created_on')
    search_fields = ('occupier', 'body')
    actions = ['approve_comments']

    def approve_comments(self,request,queryset):
        queryset.update()



