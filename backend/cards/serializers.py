from rest_framework import serializers
from .models import Card, Variant, Available, Wanted, Contact
from .pricing import get_variant_price


class CardSerializer(serializers.ModelSerializer):
    variants_url = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = ['id', 'oracle_id', 'name', 'variants_url']

    def get_variants_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/cards/{obj.id}/variants/')
        return f'/api/cards/{obj.id}/variants/'


class CardDetailSerializer(CardSerializer):
    viewer_has_it = serializers.SerializerMethodField()
    viewer_wants_it = serializers.SerializerMethodField()

    class Meta(CardSerializer.Meta):
        fields = CardSerializer.Meta.fields + ['viewer_has_it', 'viewer_wants_it']

    def _viewer(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return user if user and user.is_authenticated else None

    def get_viewer_has_it(self, obj):
        viewer = self._viewer()
        if not viewer:
            return False
        return Available.objects.filter(user=viewer, variant__card=obj).exists()

    def get_viewer_wants_it(self, obj):
        viewer = self._viewer()
        if not viewer:
            return False
        return Wanted.objects.filter(user=viewer, card=obj).exists()


class VariantSerializer(serializers.ModelSerializer):
    set_name = serializers.CharField(source='card_set.name', read_only=True)
    set_short = serializers.CharField(source='card_set.short', read_only=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = ['id', 'scryfall_id', 'collector_number', 'image', 'set_name', 'set_short', 'finishes', 'price']

    def get_price(self, obj):
        return get_variant_price(obj.scryfall_id)


class AvailableSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source='variant.id', read_only=True)
    card_id = serializers.IntegerField(source='variant.card_id', read_only=True)
    card_name = serializers.CharField(source='variant.card.name', read_only=True)
    set_name = serializers.CharField(source='variant.card_set.name', read_only=True)
    image = serializers.CharField(source='variant.image', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    wanted_count = serializers.IntegerField(read_only=True, default=0)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Available
        fields = ['id', 'card_id', 'variant_id', 'card_name', 'set_name', 'image', 'finish', 'condition', 'language', 'username', 'wanted_count', 'quantity', 'price']

    def get_price(self, obj):
        return get_variant_price(obj.variant.scryfall_id)


class AvailableCreateSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1, default=1)

    class Meta:
        model = Available
        fields = ['variant', 'finish', 'condition', 'language', 'quantity']


class WantedSerializer(serializers.ModelSerializer):
    card_name = serializers.CharField(source='card.name', read_only=True)
    variant_id = serializers.SerializerMethodField()
    set_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    matches_count = serializers.IntegerField(read_only=True)
    card_id = serializers.IntegerField(read_only=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Wanted
        fields = ['id', 'card_id', 'variant_id', 'card_name', 'set_name', 'image', 'finish', 'username', 'matches_count', 'quantity', 'price']

    def get_variant_id(self, obj):
        return obj.variant.id if obj.variant else None

    def get_set_name(self, obj):
        return obj.variant.card_set.name if obj.variant else None

    def get_image(self, obj):
        return obj.variant.image if obj.variant else obj.fallback_image

    def get_price(self, obj):
        return get_variant_price(obj.variant.scryfall_id) if obj.variant else None


class WantedCreateSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1, default=1)

    class Meta:
        model = Wanted
        fields = ['card', 'variant', 'finish', 'quantity']


class ContactUserSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, allow_blank=False, max_length=1000)


class ContactSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = ['id', 'sender_username', 'message', 'created_at', 'read_at', 'is_read']
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None


class ContactDetailSerializer(ContactSerializer):
    sender_email = serializers.SerializerMethodField()
    sender_phone = serializers.SerializerMethodField()
    sender_facebook_url = serializers.SerializerMethodField()

    class Meta(ContactSerializer.Meta):
        fields = ContactSerializer.Meta.fields + ['sender_email', 'sender_phone', 'sender_facebook_url']
        read_only_fields = fields

    def _sender_profile(self, obj):
        return getattr(obj.sender, 'profile', None)

    def get_sender_email(self, obj):
        profile = self._sender_profile(obj)
        return (profile.contact_email if profile else None) or obj.sender.email

    def get_sender_phone(self, obj):
        profile = self._sender_profile(obj)
        return profile.phone if profile else None

    def get_sender_facebook_url(self, obj):
        profile = self._sender_profile(obj)
        return profile.facebook_url if profile else None
