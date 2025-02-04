from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class MarketplaceUser(AbstractUser):
    pass
    email = models.EmailField(unique=True) 
    
    # Basic fields for profile
    age = models.PositiveIntegerField(null=True, blank=True)
    sex = models.CharField(
        max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        null=True, blank=True
    )
    city = models.CharField(max_length=100, null=True, blank=True)
    preferred_location = models.TextField(null=True, blank=True)
    id_verification_status = models.CharField(
        max_length=1, choices=[('V', 'Verified'), ('P', 'Pending'), ('U', 'Unverified')],
        default='U'
    )
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    terms_accepted = models.BooleanField(default=False)
    receive_email_notifications = models.BooleanField(default=True)
    receive_sms_notifications = models.BooleanField(default=False)
    facebook_link = models.URLField(null=True, blank=True)
    instagram_link = models.URLField(null=True, blank=True)
