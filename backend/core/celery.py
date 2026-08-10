import os

from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-new-wishlist-matches': {
        'task': 'cards.tasks.check_new_wishlist_matches',
        # Interval (not crontab) so an arbitrary WISHLIST_NOTIFICATION_INTERVAL_MINUTES
        # (e.g. 5 in local dev) "just works" without crontab-syntax gymnastics.
        'schedule': settings.WISHLIST_NOTIFICATION_INTERVAL_MINUTES * 60,
    },
}
