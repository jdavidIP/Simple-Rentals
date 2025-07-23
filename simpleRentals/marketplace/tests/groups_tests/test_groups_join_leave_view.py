from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, Group, RoommateUser
from datetime import date

class TestGroupJoinLeaveViews(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(username="bob", email="bob@rentals.com", password="pass1234")
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
            owner=self.user,
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
        self.group = Group.objects.create(
            name="Joinable Group", listing=self.listing, owner=self.roommate,
            move_in_date="2025-10-01", group_status='O'
        )
        self.url_join = reverse('join_group', kwargs={'pk': self.group.id})
        self.url_leave = reverse('leave_group', kwargs={'pk': self.group.id})

    def test_join_group(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url_join)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_join_group_twice(self):
        self.client.force_authenticate(user=self.user)
        self.group.members.add(self.roommate)
        response = self.client.put(self.url_join)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already a member", response.data['detail'])

    def test_leave_group(self):
        self.group.members.add(self.roommate)
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url_leave)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_leave_group_not_member(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url_leave)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
