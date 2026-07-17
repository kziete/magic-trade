import json
from django.core.management.base import BaseCommand
from cards.models import Set, Card, Variant, Finish


class Command(BaseCommand):
    help = 'Carga cartas desde un archivo JSONL de Scryfall'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Ruta al archivo JSONL')

    def handle(self, *args, **options):
        file_path = options['file']

        sets_cache = {}
        cards_cache = {}
        variants_to_upsert = []
        skipped = 0
        batch_size = 1000

        self.stdout.write(f'Leyendo {file_path}...')

        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                data = json.loads(line)

                # Extraer imágenes: image_uris o card_faces
                image = None
                back_image = None
                oracle_id = data.get("oracle_id")
                if data.get("object") != "card":
                    skipped += 1
                    continue

                try:
                    if 'image_uris' in data:
                        image = data['image_uris'].get('normal')
                    elif 'card_faces' in data and len(data['card_faces']) >= 2:
                        front_face = data['card_faces'][0]
                        back_face = data['card_faces'][1]
                        if 'image_uris' in front_face:
                            image = front_face['image_uris'].get('normal')
                            if not oracle_id:
                                oracle_id = front_face["oracle_id"]
                        if 'image_uris' in back_face:
                            back_image = back_face['image_uris'].get('normal')

                    if not image:
                        skipped += 1
                        continue

                    set_code = data['set']
                    if set_code not in sets_cache:
                        card_set, _ = Set.objects.get_or_create(
                            short=set_code,
                            defaults={'name': data['set_name']}
                        )
                        sets_cache[set_code] = card_set

                    if oracle_id not in cards_cache:
                        card, _ = Card.objects.get_or_create(
                            oracle_id=oracle_id,
                            defaults={'name': data['name']}
                        )
                        cards_cache[oracle_id] = card

                    valid_finishes = {f.value for f in Finish}
                    finishes = [f for f in data.get('finishes', []) if f in valid_finishes]

                    variants_to_upsert.append(Variant(
                        scryfall_id=data['id'],
                        card=cards_cache[oracle_id],
                        collector_number=data["collector_number"],
                        image=image,
                        back_image=back_image,
                        card_set=sets_cache[set_code],
                        finishes=finishes,
                    ))
                except Exception as e:
                    import pprint
                    pprint.pprint(data)
                    raise e

                if len(variants_to_upsert) >= batch_size:
                    Variant.objects.bulk_create(
                        variants_to_upsert,
                        update_conflicts=True,
                        unique_fields=['scryfall_id'],
                        update_fields=['card', 'collector_number', 'image', 'back_image', 'card_set', 'finishes'],
                    )
                    self.stdout.write(f'  Procesadas {line_num} líneas...')
                    variants_to_upsert = []

        if variants_to_upsert:
            Variant.objects.bulk_create(
                variants_to_upsert,
                update_conflicts=True,
                unique_fields=['scryfall_id'],
                update_fields=['card', 'collector_number', 'image', 'back_image', 'card_set', 'finishes'],
            )

        total_variants = Variant.objects.count()
        total_cards = Card.objects.count()
        total_sets = Set.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f'Carga completada: {total_variants} variantes, {total_cards} cartas, {total_sets} sets. '
            f'Omitidas: {skipped} (sin imagen)'
        ))
