import json
import logging

import redis
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)

_CACHE_KEY_PREFIX = "card-price:"
_SCRYFALL_CARD_URL = "https://api.scryfall.com/cards/{scryfall_id}"
_HEADERS = {
    "User-Agent": "MagicTrade/1.0 (+https://magictrade.app; contact: kziete@gmail.com)",
    "Accept": "application/json",
}
_REQUEST_TIMEOUT_SECONDS = 5
_ERROR_MARKER = {"error": True}


def _cache_key(scryfall_id: str) -> str:
    return f"{_CACHE_KEY_PREFIX}{scryfall_id}"


def _fetch_from_scryfall(scryfall_id: str) -> dict | None:
    """Hits Scryfall's single-card endpoint. Returns {"usd": ..., "usd_foil": ...}
    on success (even if both are None), or None on any failure. Doesn't touch Redis."""
    url = _SCRYFALL_CARD_URL.format(scryfall_id=scryfall_id)
    try:
        response = requests.get(url, headers=_HEADERS, timeout=_REQUEST_TIMEOUT_SECONDS)
    except requests.RequestException:
        logger.warning("Scryfall request failed for %s", scryfall_id, exc_info=True)
        return None

    if response.status_code == 404:
        logger.info("Scryfall has no card %s (404)", scryfall_id)
        return None

    try:
        response.raise_for_status()
    except requests.HTTPError:
        logger.warning("Scryfall returned %s for %s", response.status_code, scryfall_id)
        return None

    data = response.json()
    prices = data.get("prices") or {}
    return {"usd": prices.get("usd"), "usd_foil": prices.get("usd_foil")}


def fetch_and_cache_variant_price(scryfall_id: str) -> dict | None:
    """Always hits Scryfall (ignores any existing cache entry), caches the result
    (positive with the normal TTL, negative with the short error TTL) and returns it."""
    result = _fetch_from_scryfall(scryfall_id)
    key = _cache_key(scryfall_id)
    try:
        if result is None:
            _redis_client.set(key, json.dumps(_ERROR_MARKER), ex=settings.CARD_PRICE_ERROR_CACHE_TTL_SECONDS)
        else:
            _redis_client.set(key, json.dumps(result), ex=settings.CARD_PRICE_CACHE_TTL_SECONDS)
    except redis.RedisError:
        logger.warning("Failed to cache price for %s in Redis", scryfall_id, exc_info=True)
    return result


def get_variant_price(scryfall_id: str) -> dict | None:
    """Cache-first lookup: reads Redis if available, otherwise fetches from
    Scryfall and caches it. Returns None if no price is available or Scryfall
    failed recently (negative cache)."""
    key = _cache_key(scryfall_id)
    try:
        cached = _redis_client.get(key)
    except redis.RedisError:
        logger.warning("Failed to read price for %s from Redis", scryfall_id, exc_info=True)
        cached = None

    if cached is not None:
        data = json.loads(cached)
        if data == _ERROR_MARKER:
            return None
        return data

    return fetch_and_cache_variant_price(scryfall_id)
