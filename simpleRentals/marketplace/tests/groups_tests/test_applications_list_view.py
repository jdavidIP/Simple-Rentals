from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, Group, RoommateUser
from datetime import date

class TestApplicationListView(APITestCase):
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
        # Groups with different statuses
        self.group1 = Group.objects.create(
            name="Group Sent", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-01", group_status='S'
        )
        self.group2 = Group.objects.create(
            name="Group Rejected", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-15", group_status='R'
        )
        self.group2.members.add(self.roommate)
        self.url = reverse('get_applications')

    def test_landlord_sees_sent_groups(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Group Sent")

    def test_tenant_sees_rejected_and_invited_groups(self):
        self.group2.group_status = 'I'
        self.group2.save()
        self.client.force_authenticate(user=self.tenant)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Group Rejected")
