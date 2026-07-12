from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User

from cards.models import Available
from cards.services import load_inventory, LOADERS


class Command(BaseCommand):
    help = 'Carga inventario desde un archivo CSV'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Ruta al archivo CSV')
        parser.add_argument(
            '--user',
            type=str,
            required=True,
            help='Username del usuario',
        )
        parser.add_argument(
            '--format',
            type=str,
            default='moxfield',
            choices=list(LOADERS.keys()),
            help='Formato del archivo (default: moxfield)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Eliminar inventario existente del usuario antes de cargar',
        )

    def handle(self, *args, **options):
        file_path = options['file']
        username = options['user']
        format = options['format']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'Usuario no encontrado: {username}')

        if options['clear']:
            deleted, _ = Available.objects.filter(user=user).delete()
            self.stdout.write(f'Eliminados {deleted} registros existentes')

        self.stdout.write(f'Cargando inventario desde {file_path} para {username} (formato: {format})...')

        with open(file_path, 'r', encoding='utf-8') as f:
            result = load_inventory(f, user, format)

        self.stdout.write(self.style.SUCCESS(
            f'Carga completada: {result.created} creados, {result.skipped} omitidos'
        ))

        if result.errors:
            self.stdout.write(self.style.WARNING(f'\nErrores ({len(result.errors)}):'))
            for error in result.errors[:20]:
                self.stdout.write(f'  - {error}')
            if len(result.errors) > 20:
                self.stdout.write(f'  ... y {len(result.errors) - 20} más')
