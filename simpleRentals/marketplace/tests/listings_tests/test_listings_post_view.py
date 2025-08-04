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
        self.client.force_authenticate(user=self.user)

        self.post_url = reverse('post_listing')

    def test_create_listing_valid(self):
        image1 = SimpleUploadedFile('test_image1.jpg', b'file_content', content_type='image/jpeg')
        image2 = SimpleUploadedFile('test_image2.jpg', b'file_content', content_type='image/jpeg')
        image3 = SimpleUploadedFile('test_image3.jpg', b'file_content', content_type='image/jpeg')
        image4 = SimpleUploadedFile('test_image4.jpg', b'file_content', content_type='image/jpeg')

        data = {
            "price": "1200.00",
            "property_type": "A",
            "payment_type": "C",
            "bedrooms": 2,
            "bathrooms": 1,
            "sqft_area": 800,
            "laundry_type": "I",
            "parking_spaces": 1,
            "heating": True,
            "ac": True,
            "move_in_date": "2095-08-01",
            "description": "Beautiful apartment",
            "street_address": "456 Elm St",
            "city": "Newville",
            "postal_code": "67890",
            "front_image": image1,
            "pictures": [image2, image3, image4]
        }

        response = self.client.post(self.post_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

    def test_create_listing_invalid(self):
        image1 = SimpleUploadedFile('test_image1.jpg', b'file_content', content_type='image/jpeg')
        image2 = SimpleUploadedFile('test_image2.jpg', b'file_content', content_type='image/jpeg')
        image3 = SimpleUploadedFile('test_image3.jpg', b'file_content', content_type='image/jpeg')
        image4 = SimpleUploadedFile('test_image4.jpg', b'file_content', content_type='image/jpeg')

        data = {
            "price": "1200.00",
            "property_type": "A",
            "payment_type": "C",
            "bedrooms": 2,
            "laundry_type": "I",
            "parking_spaces": 1,
            "heating": True,
            "ac": True,
            "move_in_date": "2095-08-01",
            "description": "Beautiful apartment",
            "street_address": "456 Elm St",
            "city": "Newville",
            "postal_code": "67890",
            "front_image": image1,
            "pictures": [image2, image3, image4]
        }

        response = self.client.post(self.post_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('bathrooms', response.data)
        self.assertIn('sqft_area', response.data)

    def test_create_listing_no_pictures(self):

        data = {
            "price": "1200.00",
            "property_type": "A",
            "payment_type": "C",
            "bedrooms": 2,
            "bathrooms": 1,
            "sqft_area": 800,
            "laundry_type": "I",
            "parking_spaces": 1,
            "heating": True,
            "ac": True,
            "move_in_date": "2095-08-01",
            "description": "Beautiful apartment",
            "street_address": "456 Elm St",
            "city": "Newville",
            "postal_code": "67890"
        }

        response = self.client.post(self.post_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('front_image', response.data)
        self.assertIn('images', response.data)