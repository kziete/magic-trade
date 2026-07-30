import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from accounts.models import Profile
from accounts.serializers import ProfileSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': profile.phone if profile else None,
            'contact_email': profile.contact_email if profile else None,
            'facebook_url': profile.facebook_url if profile else None,
        })

    def patch(self, request):
        username = request.data.get('username')
        if username is not None:
            username = username.strip()
            if not username:
                return Response(
                    {'error': 'Username cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if User.objects.exclude(pk=request.user.pk).filter(username=username).exists():
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.username = username
            request.user.save(update_fields=['username'])

        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return self.get(request)


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response(
                {'error': 'username, email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter


class FacebookLoginView(APIView):
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Authorization code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get Facebook app credentials
        fb_settings = settings.SOCIALACCOUNT_PROVIDERS.get('facebook', {}).get('APP', {})
        client_id = fb_settings.get('client_id')
        client_secret = fb_settings.get('secret')
        redirect_uri = settings.FACEBOOK_REDIRECT_URI

        # Exchange code for access token
        token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        token_params = {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'code': code,
        }

        token_response = requests.get(token_url, params=token_params)
        if token_response.status_code != 200:
            return Response(
                {'error': 'Failed to exchange code for token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_data = token_response.json()
        access_token = token_data.get('access_token')

        # Get user info from Facebook
        user_url = 'https://graph.facebook.com/me'
        user_params = {
            'access_token': access_token,
            'fields': 'id,email,first_name,last_name,name',
        }

        user_response = requests.get(user_url, params=user_params)
        if user_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from Facebook'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fb_user = user_response.json()
        email = fb_user.get('email')
        fb_id = fb_user.get('id')
        name = fb_user.get('name', '')

        # Find or create user
        if email:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'fb_{fb_id}',
                    'first_name': fb_user.get('first_name', ''),
                    'last_name': fb_user.get('last_name', ''),
                }
            )
        else:
            user, created = User.objects.get_or_create(
                username=f'fb_{fb_id}',
                defaults={
                    'first_name': fb_user.get('first_name', ''),
                    'last_name': fb_user.get('last_name', ''),
                }
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        })
