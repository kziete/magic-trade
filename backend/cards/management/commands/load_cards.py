import json
from django.core.management.base import BaseCommand
from cards.models import Set, Card, Variant


class Command(BaseCommand):
    help = 'Carga cartas desde un archivo JSONL de Scryfall'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Ruta al archivo JSONL')
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Eliminar todas las cartas y sets antes de cargar',
        )

    def handle(self, *args, **options):
        file_path = options['file']

        if options['clear']:
            self.stdout.write('Eliminando datos existentes...')
            Variant.objects.all().delete()
            Card.objects.all().delete()
            Set.objects.all().delete()

        sets_cache = {}
        cards_cache = {}
        variants_to_create = []
        skipped = 0
        batch_size = 1000

        self.stdout.write(f'Leyendo {file_path}...')

        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                data = json.loads(line)

                if 'image_uris' not in data:
                    skipped += 1
                    continue

                set_code = data['set']
                if set_code not in sets_cache:
                    card_set, _ = Set.objects.get_or_create(
                        short=set_code,
                        defaults={'name': data['set_name']}
                    )
                    sets_cache[set_code] = card_set

                oracle_id = data['oracle_id']
                if oracle_id not in cards_cache:
                    card, _ = Card.objects.get_or_create(
                        oracle_id=oracle_id,
                        defaults={'name': data['name']}
                    )
                    cards_cache[oracle_id] = card

                variants_to_create.append(Variant(
                    scryfall_id=data['id'],
                    card=cards_cache[oracle_id],
                    collector_number=data["collector_number"],
                    image=data['image_uris']['normal'],
                    card_set=sets_cache[set_code],
                ))

                if len(variants_to_create) >= batch_size:
                    Variant.objects.bulk_create(variants_to_create)
                    self.stdout.write(f'  Procesadas {line_num} líneas...')
                    variants_to_create = []

        if variants_to_create:
            Variant.objects.bulk_create(variants_to_create)

        total_variants = Variant.objects.count()
        total_cards = Card.objects.count()
        total_sets = Set.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f'Carga completada: {total_variants} variantes, {total_cards} cartas, {total_sets} sets. '
            f'Omitidas: {skipped} (sin imagen)'
        ))
