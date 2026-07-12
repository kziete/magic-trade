from django.db import models


class Set(models.Model):
    short = models.CharField()
    name = models.CharField()

    def __str__(self) -> str:
        return f"{self.short} - {self.name}"

class Card(models.Model):
    scryfall_id = models.CharField(max_length=36, unique=True)
    oracle_id = models.CharField(max_length=36)
    name = models.CharField()
    image = models.CharField()
    card_set = models.ForeignKey(Set, on_delete=models.PROTECT)

    def __str__(self) -> str:
        return self.name


class Available(models.Model):
    card = models.ForeignKey(Card, on_delete=models.PROTECT)


class Wanted(models.Model):
    card = models.ForeignKey(Card, on_delete=models.PROTECT)




