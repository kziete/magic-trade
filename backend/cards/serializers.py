from rest_framework import serializers
from .models import Card, Variant, Available, Wanted


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


class VariantSerializer(serializers.ModelSerializer):
    set_name = serializers.CharField(source='card_set.name', read_only=True)
    set_short = serializers.CharField(source='card_set.short', read_only=True)

    class Meta:
        model = Variant
        fields = ['id', 'scryfall_id', 'collector_number', 'image', 'set_name', 'set_short', 'finishes']


class AvailableSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source='variant.id', read_only=True)
    card_name = serializers.CharField(source='variant.card.name', read_only=True)
    set_name = serializers.CharField(source='variant.card_set.name', read_only=True)
    image = serializers.CharField(source='variant.image', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Available
        fields = ['id', 'variant_id', 'card_name', 'set_name', 'image', 'finish', 'condition', 'language', 'username']


class AvailableCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Available
        fields = ['variant', 'finish', 'condition', 'language']


class WantedSerializer(serializers.ModelSerializer):
    card_name = serializers.CharField(source='card.name', read_only=True)
    variant_id = serializers.SerializerMethodField()
    set_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    matches_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Wanted
        fields = ['id', 'variant_id', 'card_name', 'set_name', 'image', 'finish', 'username', 'matches_count']

    def get_variant_id(self, obj):
        return obj.variant.id if obj.variant else None

    def get_set_name(self, obj):
        return obj.variant.card_set.name if obj.variant else None

    def get_image(self, obj):
        return obj.variant.image if obj.variant else obj.fallback_image


class WantedCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wanted
        fields = ['card', 'variant', 'finish']
