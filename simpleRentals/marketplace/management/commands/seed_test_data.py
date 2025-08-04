from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from ...models import Listing, ListingPicture, RoommateUser, Group, Review 
from django.core.files.base import ContentFile
import base64

class Command(BaseCommand):
    help = 'Seeds the database with test user and test data'

    def handle(self, *args, **kwargs):
        User = get_user_model()

        # Create test user
        user, created = User.objects.get_or_create(
            id=100,
            email='test@example.com',
            defaults={
                'username': 'test',
                'password': 'securepassword',
                'email_verified': True,
                'first_name': "Test",
                "last_name": "User"
            }
        )
        if created:
            user.set_password('securepassword')
            user.save()

        user2, created2 = User.objects.get_or_create(
            id=98,
            email='test2@example.com',
            defaults={
                'username': 'test2',
                'password': 'securepassword',
                'email_verified': True,
                'first_name': "Test",
                "last_name": "User2"
            }
        )
        if created2:
            user2.set_password('securepassword')
            user2.save()
        

        user3, created3 = User.objects.get_or_create(
            id=99,
            email='test3@example.com',
            defaults={
                'username': 'test3',
                'password': 'securepassword',
                'email_verified': True,
                'first_name': "Test",
                "last_name": "User3"
            }
        )
        if created3:
            user3.set_password('securepassword')
            user3.save()

        roommate_defaults = {
            'user': user2,
            'description': "I am a nice test coming from Test2!",
            'move_in_date': timezone.now().date(),
            'stay_length': 18,
            'occupation': 'S',
            'roommate_budget': 1200,
            'smoke_friendly': False,
            'cannabis_friendly': True,
            'pet_friendly': True,
            'couple_friendly': True,
            'gender_preference': 'O',
            'open_to_message': True
        }

        roommate_defaults2 = {
            'user': user3,
            'description': "I am a nice test coming from Test3!",
            'move_in_date': timezone.now().date(),
            'stay_length': 13,
            'occupation': 'E',
            'roommate_budget': 1200,
            'smoke_friendly': True,
            'cannabis_friendly': True,
            'pet_friendly': False,
            'couple_friendly': True,
            'gender_preference': 'O',
            'open_to_message': True
        }

       # Try to get or create listing with required fields
        listing_defaults = {
            'owner': user,
            'price': 1500.00,
            'property_type': 'A',
            'payment_type': 'D',
            'bedrooms': 2,
            'bathrooms': 1,
            'sqft_area': 850,
            'laundry_type': 'I',
            'parking_spaces': 1,
            'heating': True,
            'ac': True,
            'extra_amenities': 'Balcony, Gym Access',
            'pet_friendly': True,
            'verification_status': 'V',
            'move_in_date': timezone.now().date(),
            'description': 'A bright, clean 2-bedroom apartment in downtown.',
            'unit_number': '302',
            'street_address': '123 Main St',
            'city': 'Toronto',
            'postal_code': 'M5H 2N2',
            'latitude': 43.6532,
            'longitude': -79.3832,
            'utilities_cost': 100.00,
            'utilities_payable_by_tenant': True,
            'property_taxes': 0.00,
            'property_taxes_payable_by_tenant': False,
            'condo_fee': 50.00,
            'condo_fee_payable_by_tenant': True,
            'hoa_fee': 0.00,
            'hoa_fee_payable_by_tenant': False,
            'security_deposit': 500.00,
            'security_deposit_payable_by_tenant': True,
            'shareable': True
        }

        listing, _ = Listing.objects.get_or_create(id=7, defaults=listing_defaults)
        roommate, _ = RoommateUser.objects.get_or_create(id=6, defaults=roommate_defaults)
        roommate2, _ = RoommateUser.objects.get_or_create(id=7, defaults=roommate_defaults2)

        review_defaults = {
            'reviewer': user,
            'reviewee': user2,
            'rating': 5,
            'comment': 'Good test guy',
            'created_at': timezone.now(),
            'reviewee_role': 'T'
        }
        review, _ = Review.objects.get_or_create(id=123, defaults=review_defaults)

        # Add sample listing pictures
        if not ListingPicture.objects.filter(listing=listing).exists():
            transparent_png = base64.b64decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="
            )

            for i in range(5):
                pic = ListingPicture(
                    listing=listing,
                    location='UN',
                    is_primary=(i == 0)
                )
                pic.image.save(f'test_image_{i+1}.png', ContentFile(transparent_png), save=True)

        group_defaults = {
            'owner': roommate,
            'listing': listing,
            'description': "Nice testing group!",
            'move_in_date': timezone.now().date(),
            'move_in_ready': False,
            'group_status': 'P'
        }

        # Create or get the group first, WITHOUT members
        group, created = Group.objects.get_or_create(id=1, defaults=group_defaults)

        # Only set members if the group was newly created
        if created:
            group.members.set([roommate, roommate2])

        self.stdout.write(self.style.SUCCESS('Test users, listing, and pictures created successfully.'))
