from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, RoommateUser
from datetime import date

class TestGroupPostingView(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(username="alice", email="alice@rentals.com", password="pass1234")
        self.landlord = MarketplaceUser.objects.create_user(username="landlord", email="landlord@rentals.com", password="pass1234")
        self.roommate = RoommateUser.objects.create(
            user=self.user,
            description="Need a place ASAP",
            move_in_date=date.today(),
            stay_length=6,
            occupation='N',
            roommate_budget=700,
            smoke_friendly=False,
            cannabis_friendly=False,
            pet_friendly=False,
            couple_friendly=False,
            gender_preference='O',
            open_to_message=True
        )
        self.listing = Listing.objects.create(
            owner=self.landlord,
            price=1200.00,
            property_type="A",
            payment_type="C",
            bedrooms=2,
            bathrooms=1,
            sqft_area=800,
            laundry_type="I",
            parking_spaces=1,
            heating=True,
            ac=True,
            move_in_date="2025-08-01",
            description="Sample listing",
            street_address="123 Main St",
            city="Testville",
            postal_code="12345"
        )
        self.url = reverse('post_groups', kwargs={'pk': self.listing.id})

    def test_create_group_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "name": "New Group",
            "listing": self.listing.id,
            "move_in_date": "2025-09-01",
            "group_status": "O"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "New Group")

    def test_create_group_unauthenticated(self):
        data = {
            "name": "Fail Group",
            "listing": self.listing.id,
            "move_in_date": "2025-09-01",
            "group_status": "O"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
