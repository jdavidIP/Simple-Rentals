from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, Group, RoommateUser
from datetime import date

class TestGroupManageView(APITestCase):
    def setUp(self):
        # Landlord user
        self.landlord = MarketplaceUser.objects.create_user(username="landlord", email="landlord@rentals.com", password="pass1234")
        self.tenant = MarketplaceUser.objects.create_user(username="tenant", email="tenant@rentals.com", password="pass1234")
        self.roommate = RoommateUser.objects.create(
            user=self.tenant,
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
        # Groups for listing
        self.group1 = Group.objects.create(
            name="Group One", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-01", group_status='S'
        )
        self.group2 = Group.objects.create(
            name="Group Two", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-15", group_status='S'
        )
        self.url = reverse('manage_group', kwargs={'pk': self.group1.id})

    def test_landlord_can_set_group_status_invited(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.patch(self.url, {"group_status": "I"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group1.refresh_from_db()
        self.assertEqual(self.group1.group_status, "I")
        self.group2.refresh_from_db()
        self.assertEqual(self.group2.group_status, "R")  # others rejected

    def test_landlord_invalid_status(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.patch(self.url, {"group_status": "X"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("only set status to", response.data['error'])

    def test_non_landlord_cannot_manage(self):
        other_user = MarketplaceUser.objects.create_user(username="user", password="pass1234")
        self.client.force_authenticate(user=other_user)
        response = self.client.patch(self.url, {"group_status": "I"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
