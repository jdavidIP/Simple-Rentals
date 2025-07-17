from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from marketplace.models import MarketplaceUser, Listing, ListingPicture

class TestDeleteListing(APITestCase):
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

        self.delete_url = reverse('delete_listing', args=[self.listing.id])

    def test_delete_listing_valid(self):
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Listing.objects.filter(id=self.listing.id).exists())

    def test_delete_listing_unauthenticated(self):
        self.client.logout()
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_listing_unauthorized(self):
        """A different user tries to delete a listing they don't own."""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Listing.objects.filter(id=self.listing.id).exists())