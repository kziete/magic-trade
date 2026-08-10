import hashlib
import logging
import traceback

import redis
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import Http404

from cards.tasks import send_error_email

logger = logging.getLogger(__name__)

_redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)

DEDUPE_TTL_SECONDS = 24 * 60 * 60


class ExceptionAlertMiddleware:
    """Emails ERROR_ALERT_EMAIL on unhandled exceptions, at most once per
    distinct error per 24h (deduped via a Redis SETNX key)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        # DRF already converts Http404/PermissionDenied/APIException into
        # normal HTTP responses inside its own dispatch(), so these only
        # reach here from non-DRF code paths (e.g. admin, allauth).
        if isinstance(exception, (Http404, PermissionDenied)):
            return None

        try:
            key_source = (
                f"{exception.__class__.__module__}.{exception.__class__.__name__}"
                f":{request.path}:{exception}"
            )
            cache_key = "error-alert:" + hashlib.sha256(key_source.encode()).hexdigest()

            if not _redis_client.set(cache_key, "1", nx=True, ex=DEDUPE_TTL_SECONDS):
                return None  # already alerted for this error in the last 24h

            user = getattr(request, "user", None)
            user_display = user if user and user.is_authenticated else "anónimo"

            subject = f"[Magic Trade] {exception.__class__.__name__} en {request.path}"
            text = (
                f"{request.method} {request.path}\n"
                f"Usuario: {user_display}\n\n"
                f"{traceback.format_exc()}"
            )
            send_error_email.delay(subject=subject, text=text)
        except Exception:
            logger.exception("ExceptionAlertMiddleware failed to report an exception")

        return None
