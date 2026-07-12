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
    list_display = ["card", "collector_number"]
    raw_id_fields = ["card", "card_set"]


@admin.register(models.Available)
class AvailableAdmin(admin.ModelAdmin):
    raw_id_fields = ["variant"]


# Register your models here.
