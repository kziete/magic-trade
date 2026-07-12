from rest_framework.generics import ListAPIView
from .models import Card, Variant
from .serializers import CardSerializer, VariantSerializer


class CardListView(ListAPIView):
    serializer_class = CardSerializer

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        return Card.objects.filter(name__icontains=query)[:10]


class VariantListView(ListAPIView):
    serializer_class = VariantSerializer

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        return Variant.objects.filter(card_id=card_id)
