import os
import shelve
import shutil
import tempfile
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from celery.schedules import maybe_schedule

from core.celery import app


class Command(BaseCommand):
    help = 'Muestra las tareas periódicas configuradas en celery beat (schedule, última corrida y próxima estimada)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schedule-file',
            type=str,
            default=str(settings.BASE_DIR / 'celerybeat-schedule'),
            help='Ruta al archivo de persistencia de celery beat (default: BASE_DIR/celerybeat-schedule)',
        )

    def handle(self, *args, **options):
        beat_schedule = app.conf.beat_schedule or {}
        if not beat_schedule:
            self.stdout.write(self.style.WARNING('No hay tareas configuradas en beat_schedule.'))
            return

        last_run_by_name = self._read_persisted_entries(options['schedule_file'])

        for name, conf in beat_schedule.items():
            schedule = maybe_schedule(conf['schedule'])

            self.stdout.write(self.style.MIGRATE_HEADING(name))
            self.stdout.write(f"  tarea:     {conf['task']}")
            self.stdout.write(f"  schedule:  {schedule}")
            if conf.get('args'):
                self.stdout.write(f"  args:      {conf['args']}")
            if conf.get('kwargs'):
                self.stdout.write(f"  kwargs:    {conf['kwargs']}")

            last_run_at, total_run_count = last_run_by_name.get(name, (None, 0))
            if last_run_at is not None:
                self.stdout.write(f'  últ. corrida: {last_run_at} ({total_run_count} corridas en total)')
                _, seconds_to_next = schedule.is_due(last_run_at)
                if seconds_to_next is not None and seconds_to_next > 0:
                    next_run = timezone.now() + timedelta(seconds=seconds_to_next)
                    self.stdout.write(f'  próx. corrida (estimada): ~{next_run}')
                else:
                    self.stdout.write('  próx. corrida: ya está vencida, debería correr en el próximo tick de beat')
            else:
                self.stdout.write('  últ. corrida: nunca (o celery beat todavía no persistió esta entrada)')
            self.stdout.write('')

    def _read_persisted_entries(self, schedule_file):
        """Lee el archivo shelve (gdbm) que celery beat usa para persistir
        last_run_at entre reinicios. Mientras beat está corriendo, mantiene
        ese archivo con un lock exclusivo (gdbm), así que abrirlo directo con
        shelve.open() casi siempre revienta con EAGAIN ("Resource temporarily
        unavailable") -- no porque el archivo no exista. Para no pelear con
        ese lock, copiamos los bytes crudos (shutil.copy no usa flock, así
        que no lo bloquea el writer) y abrimos la copia, que es un archivo
        propio sin contención."""
        last_run_by_name = {}

        if not os.path.exists(schedule_file):
            self.stdout.write(self.style.WARNING(
                f'No existe el archivo de schedule persistido ({schedule_file}) todavía -- '
                'celery beat lo crea al arrancar y lo sincroniza a disco periódicamente.'
            ))
            return last_run_by_name

        with tempfile.TemporaryDirectory() as tmp_dir:
            snapshot = os.path.join(tmp_dir, 'celerybeat-schedule-snapshot')
            try:
                shutil.copy2(schedule_file, snapshot)
                with shelve.open(snapshot, flag='r') as store:
                    entries = store.get('entries', {})
                    for name, entry in entries.items():
                        last_run_by_name[name] = (entry.last_run_at, entry.total_run_count)
            except Exception as exc:
                # Best-effort: si beat estaba escribiendo justo en el instante
                # de la copia, el snapshot puede quedar inconsistente. No es
                # grave para un comando de diagnóstico -- mostramos solo la
                # configuración en ese caso.
                self.stdout.write(self.style.WARNING(
                    f'No se pudo leer un snapshot del schedule persistido ({schedule_file}): {exc}. '
                    'Se muestra solo la configuración.'
                ))
        return last_run_by_name
