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

        self.post_url = reverse('post_listing')
        self.list_url = reverse('viewAllListings', args=[])
        self.detail_url = reverse('view_listing', args=[self.listing.id])
        self.edit_url = reverse('edit_listing', args=[self.listing.id])
        self.delete_url = reverse('delete_listing', args=[self.listing.id])

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
            "move_in_date": "2025-08-01",
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

    def test_edit_listing_valid(self):
        new_data = {
            "price": "1500.00",
            "bedrooms": 3,
            "bathrooms": 2,
            "move_in_date": "2025-09-01",
            "description": "Updated description",
        }

        # Include current pictures to avoid validation errors
        front_image = SimpleUploadedFile('front.jpg', b'file_content', content_type='image/jpeg')
        picture1 = SimpleUploadedFile('pic1.jpg', b'file_content', content_type='image/jpeg')
        picture2 = SimpleUploadedFile('pic2.jpg', b'file_content', content_type='image/jpeg')
        picture3 = SimpleUploadedFile('pic3.jpg', b'file_content', content_type='image/jpeg')

        response = self.client.patch(
            self.edit_url,
            {**new_data, "front_image": front_image, "pictures": [picture1, picture2, picture3]},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.listing.refresh_from_db()
        self.assertEqual(float(self.listing.price), 1500.00)
        self.assertEqual(self.listing.bedrooms, 3)
        self.assertEqual(self.listing.description, "Updated description")

    def test_edit_listing_unauthenticated(self):
        self.client.logout()
        response = self.client.patch(self.edit_url, {"price": "1600.00"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_edit_listing_unauthorized(self):
        """A different user tries to edit a listing they don't own."""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.edit_url, {"price": "1600.00"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.listing.refresh_from_db()
        self.assertNotEqual(self.listing.price, 1600.00)

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
