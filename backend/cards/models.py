from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField


class Finish(models.TextChoices):
    FOIL = "foil", "Foil"
    NONFOIL = "nonfoil", "Non-Foil"

class Condition(models.TextChoices):
    M = "M", "Mint"
    NM = "NM", "Near Mint"
    LP = "LP", "Lightly Played"
    MP = "MP", "Moderately Played"
    HP = "HP", "Heavily Played"

class Language(models.TextChoices):
    EN = "EN", "English"
    ES = "ES", "Spanish"
    CN = "CN", "Chinese"
    JP = "JP", "Japanese"
    ITA = "ITA", "Italian"
    OTHER = "OTHER", "Other"


class Set(models.Model):
    short = models.CharField()
    name = models.CharField()

    def __str__(self) -> str:
        return f"{self.short} - {self.name}"

class Card(models.Model):
    oracle_id = models.CharField(max_length=36)
    name = models.CharField()

    def __str__(self) -> str:
        return self.name

class Variant(models.Model):
    scryfall_id = models.CharField(max_length=36, unique=True)
    card = models.ForeignKey(Card, on_delete=models.PROTECT)
    collector_number = models.CharField()
    image = models.CharField()
    back_image = models.CharField(null=True, blank=True)
    card_set = models.ForeignKey(Set, on_delete=models.PROTECT)
    finishes = ArrayField(
        models.CharField(max_length=10, choices=Finish.choices),
        default=list,
    )

    def __str__(self) -> str:
        return f"{self.card.name} ({self.card_set.name} - {self.collector_number})"

    class Meta:
        ordering = ["card__name", "card_set__name"]


class Available(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    variant = models.ForeignKey(Variant, on_delete=models.PROTECT)
    finish = models.CharField(max_length=10, choices=Finish.choices)
    condition = models.CharField(max_length=10, choices=Condition.choices, default=Condition.NM)
    language = models.CharField(max_length=10, choices=Language.choices, default=Language.EN)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return str(self.variant) # TODO


class Wanted(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    card = models.ForeignKey(Card, on_delete=models.PROTECT)
    variant = models.ForeignKey(Variant, on_delete=models.PROTECT, null=True, blank=True)
    finish = models.CharField(max_length=10, choices=Finish.choices, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)


class Contact(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts_sent')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts_received')
    message = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'read_at']),
            models.Index(fields=['recipient', 'created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.sender.username} -> {self.recipient.username}"
