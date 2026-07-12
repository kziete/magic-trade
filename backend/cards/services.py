import csv
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from io import StringIO
from typing import BinaryIO, TextIO

from django.contrib.auth.models import User
from django.db import transaction

from .models import Available, Condition, Finish, Language, Variant


@dataclass
class LoadResult:
    created: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)


class InventoryLoader(ABC):
    """Base class for inventory loaders."""

    @abstractmethod
    def load(self, file: TextIO, user: User) -> LoadResult:
        """Load inventory from file for the given user."""
        pass


class MoxfieldLoader(InventoryLoader):
    """Loader for Moxfield CSV export format."""

    CONDITION_MAP = {
        "Mint": Condition.M,
        "Near Mint": Condition.NM,
        "Good (Lightly Played)": Condition.LP,
        "Lightly Played": Condition.LP,
        "Moderately Played": Condition.MP,
        "Heavily Played": Condition.HP,
    }

    LANGUAGE_MAP = {
        "English": Language.EN,
        "Spanish": Language.ES,
        "Chinese": Language.CN,
        "Traditional Chinese": Language.CN,
        "Japanese": Language.JP,
        "Italian": Language.ITA,
    }

    def load(self, file: TextIO, user: User) -> LoadResult:
        result = LoadResult()
        reader = csv.DictReader(file)
        availables_to_create = []

        for row in reader:
            try:
                variant = self._find_variant(row)
                if variant is None:
                    result.skipped += 1
                    result.errors.append(
                        f"Variant not found: {row['Name']} ({row['Edition']} #{row['Collector Number']})"
                    )
                    continue

                available = Available(
                    user=user,
                    variant=variant,
                    finish=self._parse_finish(row.get("Foil", "")),
                    condition=self._parse_condition(row.get("Condition", "Near Mint")),
                    language=self._parse_language(row.get("Language", "English")),
                    quantity=int(row.get("Count", 1)),
                )
                availables_to_create.append(available)

            except Exception as e:
                result.skipped += 1
                result.errors.append(f"Error processing row: {row.get('Name', 'unknown')} - {e}")

        if availables_to_create:
            with transaction.atomic():
                Available.objects.bulk_create(availables_to_create)
            result.created = len(availables_to_create)

        return result

    def _find_variant(self, row: dict) -> Variant | None:
        set_code = row.get("Edition", "").lower()
        collector_number = row.get("Collector Number", "")
        try:
            return Variant.objects.get(
                card_set__short=set_code,
                collector_number=collector_number,
            )
        except Variant.DoesNotExist:
            return None

    def _parse_finish(self, foil_value: str) -> str:
        if foil_value.lower() == "foil":
            return Finish.FOIL
        return Finish.NONFOIL

    def _parse_condition(self, condition: str) -> str:
        return self.CONDITION_MAP.get(condition, Condition.NM)

    def _parse_language(self, language: str) -> str:
        return self.LANGUAGE_MAP.get(language, Language.OTHER)


LOADERS: dict[str, type[InventoryLoader]] = {
    "moxfield": MoxfieldLoader,
}


def load_inventory(file: TextIO, user: User, format: str = "moxfield") -> LoadResult:
    """
    Load inventory from a file for the given user.

    Args:
        file: File-like object to read from
        user: User to associate the inventory with
        format: Format of the file (default: moxfield)

    Returns:
        LoadResult with counts and errors
    """
    loader_class = LOADERS.get(format)
    if loader_class is None:
        raise ValueError(f"Unknown format: {format}. Available: {', '.join(LOADERS.keys())}")

    loader = loader_class()
    return loader.load(file, user)
