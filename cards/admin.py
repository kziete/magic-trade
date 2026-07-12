from django.contrib import admin
from cards import models

@admin.register(models.Set)
class SetAdmin(admin.ModelAdmin):
    pass

@admin.register(models.Card)
class CardAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(models.Variant)
class VariantAdmin(admin.ModelAdmin):
    search_fields = ["card__name"]
    # list_display = ["name", "oracle_id"]
    raw_id_fields = ["card", "card_set"]

# Register your models here.
