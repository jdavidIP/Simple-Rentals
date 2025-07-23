from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from marketplace.models import MarketplaceUser, Listing, Group, RoommateUser
from datetime import date

class TestGroupEditDeleteViews(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(username="eve", email="eve@rentals.com", password="pass1234")
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
            name="Editable Group", listing=self.listing, owner=self.roommate,
            move_in_date="2025-11-01", group_status='O'
        )
        self.url_edit = reverse('edit_group', kwargs={'pk': self.group.id})
        self.url_delete = reverse('delete_group', kwargs={'pk': self.group.id})

    def test_edit_group_by_owner(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url_edit, {"group_status": "P"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertEqual(self.group.group_status, "P")

    def test_edit_group_invalid_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url_edit, {"group_status": "X"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_group_by_owner(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.url_delete)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
