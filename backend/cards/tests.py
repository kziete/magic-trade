import json
from unittest.mock import MagicMock, patch

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from . import pricing
from .models import Available, Card, Conversation, Message, Set, Variant, Wanted
from .serializers import AvailableSerializer, ConversationSerializer, MessageSerializer, VariantSerializer, VariantDetailSerializer, WantedSerializer
from .tasks import refresh_active_card_prices


def _mock_response(status_code=200, json_data=None):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data or {}
    if status_code >= 400:
        response.raise_for_status.side_effect = requests.HTTPError(response=response)
    else:
        response.raise_for_status.side_effect = None
    return response


class PricingTests(TestCase):
    def setUp(self):
        redis_patcher = patch.object(pricing, "_redis_client")
        requests_patcher = patch.object(pricing.requests, "get")
        self.mock_redis = redis_patcher.start()
        self.mock_requests_get = requests_patcher.start()
        self.addCleanup(redis_patcher.stop)
        self.addCleanup(requests_patcher.stop)

    def test_get_variant_price_cache_hit(self):
        cached = {"usd": "1.23", "usd_foil": None}
        self.mock_redis.get.return_value = json.dumps(cached)

        result = pricing.get_variant_price("abc")

        self.assertEqual(result, cached)
        self.mock_requests_get.assert_not_called()

    def test_get_variant_price_cache_miss_fetches_and_stores(self):
        self.mock_redis.get.return_value = None
        self.mock_requests_get.return_value = _mock_response(
            200, {"prices": {"usd": "5.00", "usd_foil": "10.00", "eur": "4.00"}}
        )

        result = pricing.get_variant_price("abc")

        self.assertEqual(result, {"usd": "5.00", "usd_foil": "10.00"})
        self.mock_requests_get.assert_called_once()
        called_url = self.mock_requests_get.call_args.args[0]
        self.assertIn("abc", called_url)
        called_headers = self.mock_requests_get.call_args.kwargs["headers"]
        self.assertIn("User-Agent", called_headers)
        self.assertEqual(called_headers["Accept"], "application/json")
        self.mock_redis.set.assert_called_once_with(
            "card-price:abc", json.dumps(result), ex=settings.CARD_PRICE_CACHE_TTL_SECONDS
        )

    def test_get_variant_price_no_price_available_caches_nulls(self):
        self.mock_redis.get.return_value = None
        self.mock_requests_get.return_value = _mock_response(
            200, {"prices": {"usd": None, "usd_foil": None}}
        )

        result = pricing.get_variant_price("abc")

        self.assertEqual(result, {"usd": None, "usd_foil": None})
        self.mock_redis.set.assert_called_once_with(
            "card-price:abc", json.dumps(result), ex=settings.CARD_PRICE_CACHE_TTL_SECONDS
        )

    def test_fetch_caches_negative_on_404(self):
        self.mock_redis.get.return_value = None
        self.mock_requests_get.return_value = _mock_response(404)

        result = pricing.get_variant_price("missing")

        self.assertIsNone(result)
        self.mock_redis.set.assert_called_once_with(
            "card-price:missing",
            json.dumps(pricing._ERROR_MARKER),
            ex=settings.CARD_PRICE_ERROR_CACHE_TTL_SECONDS,
        )

    def test_fetch_caches_negative_on_5xx(self):
        self.mock_redis.get.return_value = None
        self.mock_requests_get.return_value = _mock_response(503)

        result = pricing.get_variant_price("abc")

        self.assertIsNone(result)
        self.mock_redis.set.assert_called_once_with(
            "card-price:abc",
            json.dumps(pricing._ERROR_MARKER),
            ex=settings.CARD_PRICE_ERROR_CACHE_TTL_SECONDS,
        )

    def test_fetch_caches_negative_on_timeout(self):
        self.mock_redis.get.return_value = None
        self.mock_requests_get.side_effect = requests.Timeout

        result = pricing.get_variant_price("abc")

        self.assertIsNone(result)
        self.mock_redis.set.assert_called_once_with(
            "card-price:abc",
            json.dumps(pricing._ERROR_MARKER),
            ex=settings.CARD_PRICE_ERROR_CACHE_TTL_SECONDS,
        )

    def test_get_variant_price_respects_existing_negative_cache(self):
        self.mock_redis.get.return_value = json.dumps(pricing._ERROR_MARKER)

        result = pricing.get_variant_price("abc")

        self.assertIsNone(result)
        self.mock_requests_get.assert_not_called()

    def test_fetch_and_cache_ignores_existing_cache(self):
        self.mock_requests_get.return_value = _mock_response(
            200, {"prices": {"usd": "1.00", "usd_foil": None}}
        )

        result = pricing.fetch_and_cache_variant_price("abc")

        self.assertEqual(result, {"usd": "1.00", "usd_foil": None})
        self.mock_redis.get.assert_not_called()
        self.mock_requests_get.assert_called_once()


class VariantFixtureMixin:
    def _make_variant(self, scryfall_id, collector_number="1"):
        card_set = Set.objects.create(short="tst", name="Test Set")
        card = Card.objects.create(oracle_id="oracle-" + scryfall_id, name="Test Card")
        return Variant.objects.create(
            scryfall_id=scryfall_id,
            card=card,
            collector_number=collector_number,
            image="http://example.com/image.jpg",
            card_set=card_set,
            finishes=["nonfoil", "foil"],
        )


class SerializerPriceTests(VariantFixtureMixin, TestCase):
    def test_variant_serializer_excludes_price(self):
        variant = self._make_variant("variant-1")
        with patch("cards.serializers.get_variant_price") as mock_get:
            data = VariantSerializer(variant).data
        self.assertNotIn("price", data)
        mock_get.assert_not_called()

    def test_variant_detail_serializer_includes_price(self):
        variant = self._make_variant("variant-1b")
        fixed_price = {"usd": "9.99", "usd_foil": "19.99"}
        with patch("cards.serializers.get_variant_price", return_value=fixed_price) as mock_get:
            data = VariantDetailSerializer(variant).data
        self.assertEqual(data["price"], fixed_price)
        mock_get.assert_called_once_with("variant-1b")

    def test_available_serializer_includes_price(self):
        variant = self._make_variant("variant-2")
        user = User.objects.create(username="seller")
        available = Available.objects.create(user=user, variant=variant, finish="nonfoil")
        fixed_price = {"usd": "3.50", "usd_foil": None}
        with patch("cards.serializers.get_variant_price", return_value=fixed_price) as mock_get:
            data = AvailableSerializer(available).data
        self.assertEqual(data["price"], fixed_price)
        mock_get.assert_called_once_with("variant-2")

    def test_wanted_serializer_includes_price_when_variant_set(self):
        variant = self._make_variant("variant-3")
        user = User.objects.create(username="buyer")
        wanted = Wanted.objects.create(user=user, card=variant.card, variant=variant)
        fixed_price = {"usd": "2.00", "usd_foil": None}
        with patch("cards.serializers.get_variant_price", return_value=fixed_price) as mock_get:
            data = WantedSerializer(wanted).data
        self.assertEqual(data["price"], fixed_price)
        mock_get.assert_called_once_with("variant-3")

    def test_wanted_serializer_price_none_without_variant(self):
        card_set = Set.objects.create(short="tst2", name="Test Set 2")
        card = Card.objects.create(oracle_id="oracle-any", name="Any Card")
        user = User.objects.create(username="buyer2")
        wanted = Wanted.objects.create(user=user, card=card, variant=None)
        # WantedSerializer.get_image() expects `fallback_image`, normally added
        # by views._annotate_fallback_image() on the real queryset.
        wanted.fallback_image = None
        with patch("cards.serializers.get_variant_price") as mock_get:
            data = WantedSerializer(wanted).data
        self.assertIsNone(data["price"])
        mock_get.assert_not_called()


class RefreshActiveCardPricesTaskTests(VariantFixtureMixin, TestCase):
    def test_only_touches_variants_with_available_or_wanted(self):
        available_variant = self._make_variant("has-available")
        wanted_variant = self._make_variant("has-wanted")
        self._make_variant("unused")

        user = User.objects.create(username="someone")
        Available.objects.create(user=user, variant=available_variant, finish="nonfoil")
        Wanted.objects.create(user=user, card=wanted_variant.card, variant=wanted_variant)

        with patch("cards.tasks.fetch_and_cache_variant_price") as mock_fetch, \
                patch("cards.tasks.time.sleep") as mock_sleep:
            refresh_active_card_prices()

        called_ids = {call.args[0] for call in mock_fetch.call_args_list}
        self.assertEqual(called_ids, {"has-available", "has-wanted"})
        self.assertEqual(mock_fetch.call_count, 2)
        self.assertEqual(mock_sleep.call_count, 2)


class ConversationModelTests(TestCase):
    def test_get_or_create_between_is_order_independent(self):
        alice = User.objects.create(username="alice")
        bob = User.objects.create(username="bob")

        conversation1, created1 = Conversation.objects.get_or_create_between(alice, bob)
        conversation2, created2 = Conversation.objects.get_or_create_between(bob, alice)

        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(conversation1.id, conversation2.id)

    def test_other_user(self):
        alice = User.objects.create(username="alice2")
        bob = User.objects.create(username="bob2")
        conversation, _ = Conversation.objects.get_or_create_between(alice, bob)

        self.assertEqual(conversation.other_user(alice), bob)
        self.assertEqual(conversation.other_user(bob), alice)


class ConversationSerializerTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create(username="alice3")
        self.bob = User.objects.create(username="bob3")
        self.conversation, _ = Conversation.objects.get_or_create_between(self.alice, self.bob)

    def _request_for(self, user):
        request = MagicMock()
        request.user = user
        return request

    def test_message_serializer_fields(self):
        message = Message.objects.create(conversation=self.conversation, sender=self.alice, body="Hola")
        data = MessageSerializer(message).data
        self.assertEqual(data["sender_username"], "alice3")
        self.assertEqual(data["body"], "Hola")
        self.assertIsNone(data["read_at"])

    def test_conversation_serializer_reports_other_user_last_message_and_unread(self):
        Message.objects.create(conversation=self.conversation, sender=self.alice, body="Primero")
        last = Message.objects.create(conversation=self.conversation, sender=self.alice, body="Segundo")

        conversation = (
            Conversation.objects.filter(pk=self.conversation.pk)
            .prefetch_related("messages__sender")
            .get()
        )

        data_for_bob = ConversationSerializer(conversation, context={"request": self._request_for(self.bob)}).data
        self.assertEqual(data_for_bob["other_username"], "alice3")
        self.assertEqual(data_for_bob["last_message"]["id"], last.id)
        self.assertEqual(data_for_bob["unread_count"], 2)

        data_for_alice = ConversationSerializer(conversation, context={"request": self._request_for(self.alice)}).data
        self.assertEqual(data_for_alice["other_username"], "bob3")
        self.assertEqual(data_for_alice["unread_count"], 0)


class ConversationViewTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create(username="alice4")
        self.bob = User.objects.create(username="bob4")
        self.client = APIClient()

    def test_post_message_creates_and_touches_conversation(self):
        conversation, _ = Conversation.objects.get_or_create_between(self.alice, self.bob)
        original_last_message_at = conversation.last_message_at

        self.client.force_authenticate(self.alice)
        response = self.client.post(f"/api/conversations/{conversation.id}/messages/", {"body": "Hola Bob"})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.filter(conversation=conversation).count(), 1)
        conversation.refresh_from_db()
        self.assertGreaterEqual(conversation.last_message_at, original_last_message_at)

    def test_get_messages_marks_other_participants_messages_as_read(self):
        conversation, _ = Conversation.objects.get_or_create_between(self.alice, self.bob)
        Message.objects.create(conversation=conversation, sender=self.alice, body="Hola")

        self.client.force_authenticate(self.bob)
        response = self.client.get(f"/api/conversations/{conversation.id}/messages/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertIsNotNone(response.data[0]["read_at"])
        self.assertIsNotNone(Message.objects.get(conversation=conversation).read_at)

    def test_non_participant_cannot_access_conversation(self):
        conversation, _ = Conversation.objects.get_or_create_between(self.alice, self.bob)
        intruder = User.objects.create(username="intruder")

        self.client.force_authenticate(intruder)
        response = self.client.get(f"/api/conversations/{conversation.id}/messages/")

        self.assertEqual(response.status_code, 404)

    def test_conversation_list_only_includes_viewers_conversations(self):
        conversation, _ = Conversation.objects.get_or_create_between(self.alice, self.bob)
        Message.objects.create(conversation=conversation, sender=self.alice, body="Hola")
        other_user = User.objects.create(username="other4")
        Conversation.objects.get_or_create_between(self.bob, other_user)

        self.client.force_authenticate(self.alice)
        response = self.client.get("/api/conversations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["other_username"], "bob4")


class ContactUserViewTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create(username="alice5", email="alice5@example.com")
        self.bob = User.objects.create(username="bob5")  # no email configured
        self.client = APIClient()
        self.client.force_authenticate(self.alice)

    def test_contact_without_recipient_email_still_creates_conversation(self):
        response = self.client.post("/api/users/bob5/contact/", {"message": "Busco esta carta"})

        self.assertEqual(response.status_code, 201)
        conversation = Conversation.objects.get(pk=response.data["conversation_id"])
        self.assertEqual(conversation.other_user(self.alice), self.bob)
        self.assertEqual(Message.objects.get(conversation=conversation).body, "Busco esta carta")

    def test_contact_with_recipient_email_sends_email_and_creates_conversation(self):
        self.bob.email = "bob5@example.com"
        self.bob.save()

        with patch("cards.views.send_contact_email.delay") as mock_delay:
            response = self.client.post("/api/users/bob5/contact/", {"message": "Busco esta carta"})

        self.assertEqual(response.status_code, 201)
        mock_delay.assert_called_once()
        conversation = Conversation.objects.get(pk=response.data["conversation_id"])
        self.assertEqual(Message.objects.filter(conversation=conversation).count(), 1)
