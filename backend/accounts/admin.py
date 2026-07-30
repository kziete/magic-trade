from django.contrib import admin

from accounts import models


@admin.register(models.Profile)
class ProfileAdmin(admin.ModelAdmin):
    raw_id_fields = ["user"]
    search_fields = ["user__username", "contact_email"]
