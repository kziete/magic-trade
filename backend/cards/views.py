import io
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView, RetrieveDestroyAPIView
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import OuterRef, Subquery, Sum, Count, F, Q, Value, IntegerField
from django.db.models.functions import Coalesce
from .models import Card, Variant, Available, Wanted
from .serializers import CardSerializer, VariantSerializer, AvailableSerializer, AvailableCreateSerializer, WantedSerializer, WantedCreateSerializer, ContactUserSerializer
from .services import load_inventory, LOADERS


def _annotate_fallback_image(queryset):
    first_variant_image = (
        Variant.objects.filter(card=OuterRef('card'))
        .order_by('id')
        .values('image')[:1]
    )
    return queryset.annotate(fallback_image=Subquery(first_variant_image))


def _annotate_wishlist_matches(queryset):
    # A NULL variant/finish on the Wanted side means "any" is acceptable, so
    # Coalesce falls back to the Available row's own value to make that
    # comparison a no-op instead of excluding rows.
    matches = (
        Available.objects.filter(variant__card=OuterRef('card'))
        .exclude(user=OuterRef('user'))
        .filter(variant=Coalesce(OuterRef('variant'), F('variant')))
        .filter(finish=Coalesce(OuterRef('finish'), F('finish')))
        .order_by()
        .values('variant__card')
        .annotate(total=Sum('quantity'))
        .values('total')
    )
    return queryset.annotate(
        matches_count=Coalesce(Subquery(matches, output_field=IntegerField()), Value(0))
    )


def _annotate_available_wanted_by(queryset):
    # Unlike _annotate_wishlist_matches, the nullable variant/finish live on
    # the side being filtered here (Wanted), so Coalesce can't help (NULL =
    # anything is never TRUE in SQL) — an explicit isnull OR match is needed.
    wanted_matches = (
        Wanted.objects.filter(card=OuterRef('variant__card'))
        .exclude(user=OuterRef('user'))
        .filter(Q(variant__isnull=True) | Q(variant=OuterRef('variant')))
        .filter(Q(finish__isnull=True) | Q(finish=OuterRef('finish')))
        .order_by()
        .values('card')
        .annotate(total=Count('user', distinct=True))
        .values('total')
    )
    return queryset.annotate(
        wanted_count=Coalesce(Subquery(wanted_matches, output_field=IntegerField()), Value(0))
    )


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

        return _annotate_available_wanted_by(queryset)

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


class WishlistListView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WantedCreateSerializer
        return WantedSerializer

    def get_queryset(self):
        queryset = Wanted.objects.filter(user=self.request.user).select_related(
            'user', 'card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(card__name__icontains=query)

        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WishlistDetailView(RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WantedSerializer

    def get_queryset(self):
        queryset = Wanted.objects.filter(user=self.request.user)
        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))


class WishlistMatchesView(ListAPIView):
    serializer_class = AvailableSerializer
    pagination_class = None

    def get_queryset(self):
        wanted = get_object_or_404(Wanted, pk=self.kwargs['pk'])
        queryset = Available.objects.filter(variant__card=wanted.card).exclude(user=wanted.user)

        if wanted.variant_id:
            queryset = queryset.filter(variant_id=wanted.variant_id)

        if wanted.finish:
            queryset = queryset.filter(finish=wanted.finish)

        return queryset.select_related('user', 'variant__card', 'variant__card_set').order_by('-id')


class AvailableWantedByView(ListAPIView):
    serializer_class = WantedSerializer
    pagination_class = None

    def get_queryset(self):
        available = get_object_or_404(Available, pk=self.kwargs['pk'])
        queryset = (
            Wanted.objects.filter(card=available.variant.card)
            .exclude(user=available.user)
            .filter(Q(variant__isnull=True) | Q(variant_id=available.variant_id))
            .filter(Q(finish__isnull=True) | Q(finish=available.finish))
            .select_related('user', 'card', 'variant__card_set')
            .order_by('-id')
        )
        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))


class UserWishlistListView(ListAPIView):
    serializer_class = WantedSerializer

    def get_queryset(self):
        username = self.kwargs['username']
        queryset = Wanted.objects.filter(user__username=username).select_related(
            'user', 'card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(card__name__icontains=query)

        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))


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
        return Response({
            'username': user.username,
        })


class ContactUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        if target_user == request.user:
            return Response(
                {'error': 'No podés contactarte a vos mismo'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ContactUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # TODO: enviar el mensaje + datos de contacto de request.user al
        # target_user (email, notificación, etc). Por ahora es un stub.

        return Response(status=status.HTTP_201_CREATED)


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
