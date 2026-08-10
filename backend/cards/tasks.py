from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q
from django.template.loader import render_to_string
from django.utils import timezone
from zavudev import ZavudevError

from .models import Available, Wanted
from .zavu_client import zavu


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_contact_email(self, to_email, subject, text, html_body, reply_to):
    try:
        zavu.messages.send(
            to=to_email,
            channel="email",
            subject=subject,
            text=text,
            html_body=html_body,
            reply_to=reply_to,
        )
    except ZavudevError as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_error_email(self, subject, text):
    try:
        zavu.messages.send(
            to=settings.ERROR_ALERT_EMAIL,
            channel="email",
            subject=subject,
            text=text,
        )
    except ZavudevError as exc:
        raise self.retry(exc=exc)


@shared_task
def check_new_wishlist_matches():
    """Runs every settings.WISHLIST_NOTIFICATION_INTERVAL_MINUTES (see
    core/celery.py beat_schedule). Finds Available rows created since then
    and notifies any user whose wishlist matches one, batching all of a
    user's new matches into a single email."""
    window_start = timezone.now() - timedelta(minutes=settings.WISHLIST_NOTIFICATION_INTERVAL_MINUTES)
    new_available = Available.objects.filter(created_at__gte=window_start).select_related(
        'user', 'variant__card', 'variant__card_set'
    )

    matches_by_user = {}
    for available in new_available:
        wanted_matches = (
            Wanted.objects.filter(card=available.variant.card)
            .exclude(user=available.user)
            .filter(Q(variant__isnull=True) | Q(variant_id=available.variant_id))
            .filter(Q(finish__isnull=True) | Q(finish=available.finish))
        )
        for wanted_user_id in wanted_matches.values_list('user_id', flat=True):
            user_matches = matches_by_user.setdefault(wanted_user_id, {})
            user_matches[available.variant.card_id] = {
                'card_id': available.variant.card_id,
                'card_name': available.variant.card.name,
                'set_name': available.variant.card_set.name,
                'seller_username': available.user.username,
            }

    for user_id, matches_by_card in matches_by_user.items():
        send_wishlist_notification_email.delay(user_id, list(matches_by_card.values()))


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_wishlist_notification_email(self, user_id, matches):
    try:
        user = User.objects.select_related('profile').get(pk=user_id)
    except User.DoesNotExist:
        return

    profile = getattr(user, 'profile', None)
    to_email = (profile.contact_email if profile else None) or user.email
    if not to_email:
        return

    count = len(matches)
    subject = f"{count} carta{'s' if count != 1 else ''} que buscabas ya {'están' if count != 1 else 'está'} disponible{'s' if count != 1 else ''}"

    text_lines = [
        f"- {m['card_name']} ({m['set_name']}) — disponible por {m['seller_username']}: "
        f"{settings.FRONTEND_URL}/cards/{m['card_id']}/matches"
        for m in matches
    ]
    text = (
        "Buenas noticias, estas cartas de tu wishlist fueron registradas en la última hora:\n\n"
        + "\n".join(text_lines)
    )
    html_body = render_to_string('cards/wishlist_notification_email.html', {
        'matches': matches,
        'frontend_url': settings.FRONTEND_URL,
    })

    try:
        zavu.messages.send(
            to=to_email,
            channel="email",
            subject=subject,
            text=text,
            html_body=html_body,
        )
    except ZavudevError as exc:
        raise self.retry(exc=exc)
