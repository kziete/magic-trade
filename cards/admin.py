from django.contrib import admin
from cards import models

@admin.register(models.Set)
class SetAdmin(admin.ModelAdmin):
    pass

@admin.register(models.Card)
class CardAdmin(admin.ModelAdmin):
    search_fields = ["name"]
    list_display = ["name", "oracle_id"]
    raw_id_fields = ["card_set"]

# Register your models here.
