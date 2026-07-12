from rest_framework import serializers
from .models import Card, Variant


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
