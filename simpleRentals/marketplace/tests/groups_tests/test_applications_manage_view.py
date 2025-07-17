from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, Group, RoommateUser
from datetime import date

class TestApplicationManagementListView(APITestCase):
    def setUp(self):
        # Landlord and Roommate
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
        # Groups
        self.landlord_group = Group.objects.create(
            name="Landlord Group", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-05", group_status='S'
        )
        self.member_group = Group.objects.create(
            name="Member Group", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-15", group_status='R'
        )
        self.member_group.members.add(self.roommate)
        self.url = reverse('manage_applications')

    def test_landlord_sees_landlord_and_member_data(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("landlord", response.data)
        self.assertIn("member", response.data)
        self.assertEqual(len(response.data["landlord"]), 1)

    def test_member_sees_only_member_data(self):
        self.client.force_authenticate(user=self.tenant)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("landlord", response.data)
        self.assertIn("member", response.data)
        self.assertEqual(len(response.data["member"]), 1)
