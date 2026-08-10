from celery import shared_task
from django.conf import settings
from zavudev import ZavudevError

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
