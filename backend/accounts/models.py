from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    facebook_id = models.CharField(max_length=64, null=True, blank=True, unique=True)
    phone = models.CharField(null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    facebook_url = models.URLField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Profile de {self.user.username}"
