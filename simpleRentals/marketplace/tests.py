from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Listing, ListingPicture
from django.core.files.uploadedfile import SimpleUploadedFile

class PostListingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        self.client.login(username='testuser', password='testpass')
        self.url = reverse('post_listing')

    def test_post_listing_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'listings/add.html')

    def test_post_listing_post_valid(self):
        data = {
            'price': '1000.00',
            'property_type': 'A',
            'payment_type': 'C',
            'bedrooms': 2,
            'bathrooms': 1,
            'sqft_area': 800,
            'laundry_type': 'I',
            'parking_spaces': 1,
            'heating': True,
            'ac': True,
            'move_in_date': '2025-01-01',
            'description': 'A nice apartment.',
            'street_address': '123 Main St',
            'city': 'Testville',
            'postal_code': '12345',
            'verification_status': 'P'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Listing.objects.filter(description='A nice apartment.').exists())

    def test_post_listing_post_invalid(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'This field is required.')
