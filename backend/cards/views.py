import io
from django.contrib.auth.models import User
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView, RetrieveDestroyAPIView
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import OuterRef, Subquery, Sum, Count, F, Q, Value, IntegerField, Exists
from django.db.models.functions import Coalesce
from kombu.exceptions import OperationalError
from accounts.models import Profile
from .models import Card, Variant, Available, Wanted, Contact, Conversation, Message
from .serializers import CardSerializer, CardDetailSerializer, VariantSerializer, VariantDetailSerializer, AvailableSerializer, AvailableCreateSerializer, WantedSerializer, WantedCreateSerializer, ContactUserSerializer, ContactSerializer, ContactDetailSerializer, ConversationSerializer, MessageSerializer, MessageCreateSerializer
from .services import load_inventory, LOADERS
from .tasks import send_contact_email
from .pricing import get_variant_price, price_value_for_sort

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


class SortableListMixin:
    """Adds ?sort=card_name|set_name|price&order=asc|desc to a list view.

    card_name/set_name are real columns reachable via a DB order_by. price
    isn't stored anywhere (it's fetched live from Redis/Scryfall per variant
    in the serializer), so sorting by it means materializing the queryset
    and sorting in Python -- DRF's paginate_queryset() accepts a plain list
    just as well as a queryset, so no other plumbing needs to change.
    """
    sort_db_fields: dict = {}

    def get_sort_params(self):
        sort = self.request.query_params.get('sort')
        order = self.request.query_params.get('order', 'asc')
        if order not in ('asc', 'desc'):
            order = 'asc'
        if sort not in (set(self.sort_db_fields) | {'price'}):
            sort = None
        return sort, order

    def apply_db_sort(self, queryset, sort, order):
        field = self.sort_db_fields[sort]
        ordering = F(field).desc(nulls_last=True) if order == 'desc' else F(field).asc(nulls_last=True)
        return queryset.order_by(ordering, '-id')

    def price_key_for_item(self, item):
        """Returns (scryfall_id, finish), or (None, None) if the item has no
        priceable variant."""
        raise NotImplementedError

    def sort_by_price(self, queryset, order):
        items = list(queryset)

        def price_for(item):
            scryfall_id, finish = self.price_key_for_item(item)
            if not scryfall_id:
                return None
            return price_value_for_sort(get_variant_price(scryfall_id), finish)

        decorated = [(price_for(item), item) for item in items]
        with_price = sorted(
            (pair for pair in decorated if pair[0] is not None),
            key=lambda pair: pair[0],
            reverse=(order == 'desc'),
        )
        without_price = [item for price, item in decorated if price is None]
        return [item for _, item in with_price] + without_price

    def sort_queryset(self, queryset):
        sort, order = self.get_sort_params()
        if sort is None:
            return queryset
        if sort == 'price':
            return self.sort_by_price(queryset, order)
        return self.apply_db_sort(queryset, sort, order)


class AvailableSortMixin(SortableListMixin):
    sort_db_fields = {'card_name': 'variant__card__name', 'set_name': 'variant__card_set__name'}

    def price_key_for_item(self, item):
        return item.variant.scryfall_id, item.finish


class WantedSortMixin(SortableListMixin):
    sort_db_fields = {'card_name': 'card__name', 'set_name': 'variant__card_set__name'}

    def price_key_for_item(self, item):
        if not item.variant_id:
            return None, None
        return item.variant.scryfall_id, item.finish


class CardListView(ListAPIView):
    serializer_class = CardSerializer
    pagination_class = None
    authentication_classes = []

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        return Card.objects.filter(name__icontains=query)[:10]


class CardDetailView(RetrieveAPIView):
    serializer_class = CardDetailSerializer
    queryset = Card.objects.all()
    lookup_field = 'pk'


class CardWantedListView(ListAPIView):
    """Wanted rows for a card, for the authenticated viewer -- only
    meaningful (non-empty) if the viewer has an Available row for this card,
    since that's what makes these "people who'd trade with you"."""
    serializer_class = WantedSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        viewer = self.request.user
        has_it = Available.objects.filter(user=viewer, variant__card_id=card_id).exists()
        if not has_it:
            return Wanted.objects.none()

        queryset = (
            Wanted.objects.filter(card_id=card_id)
            .exclude(user=viewer)
            .select_related('user', 'card', 'variant__card_set')
            .order_by('-id')
        )
        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))


class VariantListView(ListAPIView):
    serializer_class = VariantSerializer
    pagination_class = None
    authentication_classes = []

    def get_queryset(self):
        card_id = self.kwargs['card_id']
        return Variant.objects.filter(card_id=card_id)


class VariantDetailView(RetrieveAPIView):
    """Single-variant lookup, used to fetch the price for the variant the
    user has selected instead of pricing every variant in the list."""
    serializer_class = VariantDetailSerializer
    queryset = Variant.objects.all()
    pagination_class = None
    authentication_classes = []
    lookup_field = 'pk'


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


class InventoryListView(AvailableSortMixin, ListCreateAPIView):
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

        queryset = _annotate_available_wanted_by(queryset)
        return self.sort_queryset(queryset)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InventoryDetailView(RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AvailableSerializer

    def get_queryset(self):
        return Available.objects.filter(user=self.request.user)


class UserInventoryListView(AvailableSortMixin, ListAPIView):
    serializer_class = AvailableSerializer

    def get_queryset(self):
        username = self.kwargs['username']
        queryset = Available.objects.filter(user__username=username).select_related(
            'user', 'variant__card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(variant__card__name__icontains=query)

        return self.sort_queryset(queryset)


class WishlistListView(WantedSortMixin, ListCreateAPIView):
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

        queryset = _annotate_wishlist_matches(_annotate_fallback_image(queryset))
        return self.sort_queryset(queryset)

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


class UserWishlistListView(WantedSortMixin, ListAPIView):
    serializer_class = WantedSerializer

    def get_queryset(self):
        username = self.kwargs['username']
        queryset = Wanted.objects.filter(user__username=username).select_related(
            'user', 'card', 'variant__card_set'
        ).order_by('-id')

        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(card__name__icontains=query)

        queryset = _annotate_wishlist_matches(_annotate_fallback_image(queryset))
        return self.sort_queryset(queryset)


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
            'bio': profile.bio if profile else None,
        })


class ContactUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username=username)
        if target_user == request.user:
            return Response(
                {'error': 'No puedes contactarte a ti mismo'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ContactUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sender_message = serializer.validated_data.get('message', '').strip()

        target_profile = getattr(target_user, 'profile', None)
        to_email = (target_profile.contact_email if target_profile else None) or target_user.email

        Contact.objects.create(
            sender=request.user,
            recipient=target_user,
            message=sender_message,
        )

        conversation, _ = Conversation.objects.get_or_create_between(request.user, target_user)
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=sender_message,
        )
        conversation.last_message_at = message.created_at
        conversation.save(update_fields=['last_message_at'])

        if not to_email:
            return Response({'conversation_id': conversation.id}, status=status.HTTP_201_CREATED)

        conversation_url = f"{settings.FRONTEND_URL}/messages/{conversation.id}"

        text_parts = [
            f"Tienes un nuevo mensaje de {request.user.username} en Cardtones.",
            "",
            "Mensaje:",
            sender_message,
            "",
            f"Responde aquí: {conversation_url}",
        ]

        html_body = render_to_string('cards/contact_email.html', {
            'sender_username': request.user.username,
            'conversation_url': conversation_url,
            'message': sender_message,
        })

        try:
            send_contact_email.delay(
                to_email=to_email,
                subject=f"Tienes un nuevo mensaje de {request.user.username} en Cardtones",
                text="\n".join(text_parts),
                html_body=html_body,
                reply_to=request.user.email,
            )
        except OperationalError:
            return Response(
                {'error': 'No se pudo enviar el mensaje, intenta nuevamente'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({'conversation_id': conversation.id}, status=status.HTTP_201_CREATED)


class NotificationPollView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        Profile.objects.filter(user=request.user).update(last_seen=timezone.now())

        unread = Contact.objects.filter(
            recipient=request.user, read_at__isnull=True
        ).select_related('sender').order_by('-created_at')[:50]

        return Response({
            'unread_count': Contact.objects.filter(
                recipient=request.user, read_at__isnull=True
            ).count(),
            'unread': ContactSerializer(unread, many=True).data,
        })


class ContactRetrieveView(APIView):
    """GET /api/contacts/<pk>/ -- detalle de un contacto recibido, incluye
    los datos de contacto del remitente. Marca la notificación como leída."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        contact = get_object_or_404(
            Contact.objects.select_related('sender'), pk=pk, recipient=request.user
        )
        if contact.read_at is None:
            contact.read_at = timezone.now()
            contact.save(update_fields=['read_at'])
        return Response(ContactDetailSerializer(contact).data)


class ContactHistoryListView(ListAPIView):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(
            recipient=self.request.user
        ).select_related('sender').order_by('-created_at')


class ContactMarkReadView(APIView):
    """POST /api/contacts/read/ -- marca todas las notificaciones no leídas
    del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Contact.objects.filter(
            recipient=request.user, read_at__isnull=True
        ).update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactDetailView(APIView):
    """POST /api/contacts/<pk>/read/ -- marca una notificación puntual como
    leída. Solo el destinatario puede marcarla."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        contact = get_object_or_404(Contact, pk=pk, recipient=request.user)
        if contact.read_at is None:
            contact.read_at = timezone.now()
            contact.save(update_fields=['read_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConversationListView(ListAPIView):
    """GET /api/conversations/ -- inbox del usuario autenticado, ordenado por
    actividad reciente. Pensado para pollear desde el frontend."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        viewer = self.request.user
        return (
            Conversation.objects.filter(Q(user_a=viewer) | Q(user_b=viewer))
            .select_related('user_a', 'user_b')
            .prefetch_related('messages__sender')
        )


class ConversationMessagesView(APIView):
    """GET /api/conversations/<pk>/messages/ -- historial (o solo lo nuevo via
    ?after_id=) de una conversación; marca como leídos los mensajes del otro
    participante, igual que ContactRetrieveView con las notificaciones.
    POST -- envía un mensaje nuevo en una conversación existente."""
    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, pk):
        conversation = get_object_or_404(
            Conversation.objects.select_related('user_a', 'user_b'), pk=pk
        )
        if request.user not in (conversation.user_a, conversation.user_b):
            raise Http404
        return conversation

    def get(self, request, pk):
        conversation = self._get_conversation(request, pk)
        messages = conversation.messages.select_related('sender').order_by('created_at')

        after_id = request.query_params.get('after_id')
        if after_id:
            messages = messages.filter(id__gt=after_id)
        messages = list(messages)

        unread_ids = [
            m.id for m in messages if m.read_at is None and m.sender_id != request.user.id
        ]
        if unread_ids:
            now = timezone.now()
            Message.objects.filter(id__in=unread_ids).update(read_at=now)
            for m in messages:
                if m.id in unread_ids:
                    m.read_at = now

        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        conversation = self._get_conversation(request, pk)
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=serializer.validated_data['body'].strip(),
        )
        conversation.last_message_at = message.created_at
        conversation.save(update_fields=['last_message_at'])

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class UserMatchesAvailableView(ListAPIView):
    """Cartas que <username> TIENE y que el usuario autenticado BUSCA."""
    serializer_class = AvailableSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        username = self.kwargs['username']
        viewer = self.request.user
        matching_wanted = Wanted.objects.filter(
            user=viewer,
            card=OuterRef('variant__card'),
        ).filter(
            Q(variant__isnull=True) | Q(variant=OuterRef('variant'))
        ).filter(
            Q(finish__isnull=True) | Q(finish=OuterRef('finish'))
        )
        queryset = (
            Available.objects.filter(user__username=username)
            .exclude(user=viewer)
            .filter(Exists(matching_wanted))
            .select_related('user', 'variant__card', 'variant__card_set')
            .order_by('-id')
        )
        return _annotate_available_wanted_by(queryset)


class UserMatchesWantedView(ListAPIView):
    """Cartas que <username> BUSCA y que el usuario autenticado TIENE."""
    serializer_class = WantedSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        username = self.kwargs['username']
        viewer = self.request.user
        matching_available = Available.objects.filter(
            user=viewer,
            variant__card=OuterRef('card'),
        ).filter(
            variant=Coalesce(OuterRef('variant'), F('variant'))
        ).filter(
            finish=Coalesce(OuterRef('finish'), F('finish'))
        )
        queryset = (
            Wanted.objects.filter(user__username=username)
            .exclude(user=viewer)
            .filter(Exists(matching_available))
            .select_related('user', 'card', 'variant__card_set')
            .order_by('-id')
        )
        return _annotate_wishlist_matches(_annotate_fallback_image(queryset))


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
