import io
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView, RetrieveDestroyAPIView
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Card, Variant, Available
from .serializers import CardSerializer, VariantSerializer, AvailableSerializer, AvailableCreateSerializer
from .services import load_inventory, LOADERS


class CardListView(ListAPIView):
    serializer_class = CardSerializer
    pagination_class = None
    authentication_classes = []

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        return Card.objects.filter(name__icontains=query)[:10]


class CardDetailView(RetrieveAPIView):
    serializer_class = CardSerializer
    queryset = Card.objects.all()
    lookup_field = 'pk'


class VariantListView(ListAPIView):
    serializer_class = VariantSerializer
    pagination_class = None
    authentication_classes = []

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        return Variant.objects.filter(card_id=card_id)


class AvailableListView(ListAPIView):
    serializer_class = AvailableSerializer
    pagination_class = None
    authentication_classes = []

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


class InventoryListView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AvailableCreateSerializer
        return AvailableSerializer

    def get_queryset(self):
        queryset = Available.objects.filter(user=self.request.user).select_related(
            'user', 'variant__card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(variant__card__name__icontains=query)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InventoryDetailView(RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AvailableSerializer

    def get_queryset(self):
        return Available.objects.filter(user=self.request.user)


class UserInventoryListView(ListAPIView):
    serializer_class = AvailableSerializer

    def get_queryset(self):
        username = self.kwargs['username']
        queryset = Available.objects.filter(user__username=username).select_related(
            'user', 'variant__card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(variant__card__name__icontains=query)

        return queryset


class LatestAvailableListView(ListAPIView):
    serializer_class = AvailableSerializer
    pagination_class = None
    authentication_classes = []

    def get_queryset(self):
        return Available.objects.select_related(
            'user', 'variant__card', 'variant__card_set'
        ).order_by('-id')[:12]


class UserProfileView(APIView):
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        profile = getattr(user, 'profile', None)
        return Response({
            'username': user.username,
            'phone': profile.phone if profile else None,
            'contact_email': profile.contact_email if profile else None,
            'facebook_url': profile.facebook_url if profile else None,
        })


class InventoryImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        format_type = request.data.get('format', 'moxfield')
        if format_type not in LOADERS:
            return Response(
                {'error': f'Unknown format: {format_type}. Available: {", ".join(LOADERS.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        clear = request.data.get('clear', '').lower() == 'true'
        if clear:
            Available.objects.filter(user=request.user).delete()

        content = file.read().decode('utf-8')
        text_file = io.StringIO(content)

        result = load_inventory(text_file, request.user, format_type)

        return Response({
            'created': result.created,
            'skipped': result.skipped,
            'errors': result.errors[:50],
        })
