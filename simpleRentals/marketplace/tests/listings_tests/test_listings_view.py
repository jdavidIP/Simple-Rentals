from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from marketplace.models import MarketplaceUser, Listing, ListingPicture

class ListingTests(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(
            username="lister", email="lister@example.com", password="pass1234"
        )
        self.other_user = MarketplaceUser.objects.create_user(
            username="intruder", email="intruder@example.com", password="pass5678"
        )
        self.client.force_authenticate(user=self.user)

        # Create a sample listing owned by self.user
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

        self.list_url = reverse('viewAllListings', args=[])
        self.detail_url = reverse('view_listing', args=[self.listing.id])

    def test_view_listing_detail(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.listing.id)
        self.assertEqual(response.data['price'], "1200.00")

    def test_view_listing_list_with_location(self):
        url = reverse('viewAllListings')
        response = self.client.get(url, {'location': 'Testville'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)

    def test_view_listing_list_with_owner(self):
        url = reverse('viewAllListings')
        response = self.client.get(url, {'owner': self.user.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
