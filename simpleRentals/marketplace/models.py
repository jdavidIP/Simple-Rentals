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

class Listing(models.Model):
    # Basic Details
    price = models.DecimalField(max_digits=10, decimal_places=2)
    property_type = models.CharField(max_length=1, choices=[('H', 'House'), ('A', 'Apartment'), ('C', 'Condo'), ('T', 'Townhouse'), ('O', 'Other')])
    payment_type = models.CharField(max_length=1, choices=[('C', 'Cheque'), ('D', 'Direct Deposit'), ('I', 'Interac / Wire Transfer'), ('P', 'PayPal'), ('X', 'Chexy'), ('O', 'Other')])
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    sqft_area = models.PositiveIntegerField()
    laundry_type = models.CharField(max_length=10, choices=[('I', 'In-Unit'), ('S', 'Shared'), ('N', 'None')])
    parking_spaces = models.IntegerField()
    heating = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    extra_amenities = models.TextField(blank=True, null=True)
    pet_friendly = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=10, choices=[('V', 'Verified'), ('P', 'Pending'), ('U', 'Unverified')], default='U')
    move_in_date = models.DateField()
    description = models.TextField()

    # Address
    unit_number = models.CharField(max_length=10, blank=True, null=True)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    # Additional fees and costs
    utilities_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    utilities_payable_by_tenant = models.BooleanField(default=False)

    property_taxes = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    property_taxes_payable_by_tenant = models.BooleanField(default=False)

    condo_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    condo_fee_payable_by_tenant = models.BooleanField(default=False)

    hoa_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    hoa_fee_payable_by_tenant = models.BooleanField(default=False)

    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    security_deposit_payable_by_tenant = models.BooleanField(default=False)

    # Foreign Keys
    owner = models.ForeignKey(MarketplaceUser, related_name="listings", on_delete=models.CASCADE)

class Location(models.TextChoices):
    AERIAL = 'A', 'Aerial View'
    FRONT = 'F', 'Front Yard / Property Front'
    BACKYARD = 'B', 'Backyard / Property Back'
    BEDROOMS = 'Br', 'Bedroom(s)'
    BATHROOMS = 'Bt', 'Bathroom(s)'
    KITCHEN = 'K', 'Kitchen'
    DINING = 'D', 'Dining Room'
    LIVING = 'L', 'Living Room'
    GARAGE = 'G', 'Garage'
    PARKING = 'P', 'Parking'
    UNCATEGORIZED = 'U', 'Uncategorized'

class ListingPicture(models.Model):
    listing = models.ForeignKey(Listing, related_name="pictures", on_delete=models.CASCADE)
    image = models.ImageField(upload_to='listing_pictures/')
    location = models.CharField(max_length=2, choices=Location.choices, default=Location.UNCATEGORIZED)
    is_primary = models.BooleanField(default=False)  # Flag to mark the picture as primary for the listing

class Group(models.Model):
    name = models.CharField(max_length=100)
    listing = models.ForeignKey(Listing, related_name="groups", on_delete=models.CASCADE)
    members = models.ManyToManyField(MarketplaceUser, related_name="groups")
    description = models.TextField(blank=True, null=True)
    move_in_date = models.DateField()
    move_in_ready = models.BooleanField(default=False)
    group_status = models.CharField(max_length=1, choices=[('O', 'Open'), ('F', 'Filled'), ('S', 'Sent'), ('U', 'Under Review'), ('R', 'Rejected'), ('I', 'Approved - Invited')], default='O')

class Review(models.Model):
    reviewer = models.ForeignKey(MarketplaceUser, related_name='given_reviews', on_delete=models.CASCADE)
    reviewee = models.ForeignKey(MarketplaceUser, related_name='received_reviews', on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewee_role = models.CharField(max_length=1, choices=[('T', 'Tenant'), ('L', 'Landlord')])

class Favorites(models.Model):
    user = models.ForeignKey(MarketplaceUser, related_name="wishlist", on_delete=models.CASCADE)
    favorite_listings = models.ManyToManyField(Listing, related_name='favorited_by', blank=True)