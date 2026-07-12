from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Card, Variant, Available
from .serializers import CardSerializer, VariantSerializer, AvailableSerializer


class CardListView(ListAPIView):
    serializer_class = CardSerializer

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        return Card.objects.filter(name__icontains=query)[:10]


class CardDetailView(RetrieveAPIView):
    serializer_class = CardSerializer
    queryset = Card.objects.all()
    lookup_field = 'pk'


class VariantListView(ListAPIView):
    serializer_class = VariantSerializer

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        return Variant.objects.filter(card_id=card_id)


class AvailableListView(ListAPIView):
    serializer_class = AvailableSerializer

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        queryset = Available.objects.filter(variant__card_id=card_id)

        variant = self.request.query_params.get('variant')
        if variant:
            queryset = queryset.filter(variant_id=variant)

        finish = self.request.query_params.get('finish')
        if finish:
            queryset = queryset.filter(finish=finish)

        condition = self.request.query_params.get('condition')
        if condition:
            queryset = queryset.filter(condition=condition)

        return queryset.select_related('user', 'variant__card', 'variant__card_set')


class InventoryListView(ListAPIView):
    serializer_class = AvailableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Available.objects.filter(user=self.request.user).select_related(
            'user', 'variant__card', 'variant__card_set'
        )
