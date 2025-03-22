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

class EditListingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        self.client.login(username='testuser', password='testpass')
        self.listing = Listing.objects.create(
            owner=self.user,
            price='1000.00',
            property_type='A',
            payment_type='C',
            bedrooms=2,
            bathrooms=1,
            sqft_area=800,
            laundry_type='I',
            parking_spaces=1,
            heating=True,
            ac=True,
            move_in_date='2025-01-01',
            description='A nice apartment.',
            street_address='123 Main St',
            city='Testville',
            postal_code='12345',
            verification_status='P'
        )
        self.url = reverse('edit_listing', args=[self.listing.id])

    def test_edit_listing_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'listings/add.html')

    def test_edit_listing_post_valid(self):
        data = {
            'price': '1200.00',
            'property_type': 'A',
            'payment_type': 'C',
            'bedrooms': 3,
            'bathrooms': 2,
            'sqft_area': 900,
            'laundry_type': 'I',
            'parking_spaces': 2,
            'heating': True,
            'ac': True,
            'move_in_date': '2025-02-01',
            'description': 'An updated nice apartment.',
            'street_address': '123 Main St',
            'city': 'Testville',
            'postal_code': '12345',
            'verification_status': 'P'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 302)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.price, 1200.00)
        self.assertEqual(self.listing.bedrooms, 3)
        self.assertEqual(self.listing.bathrooms, 2)
        self.assertEqual(self.listing.sqft_area, 900)
        self.assertEqual(self.listing.description, 'An updated nice apartment.')

    def test_edit_listing_post_invalid(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'This field is required.')

class DeleteListingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        self.client.login(username='testuser', password='testpass')
        self.listing = Listing.objects.create(
            owner=self.user,
            price='1000.00',
            property_type='A',
            payment_type='C',
            bedrooms=2,
            bathrooms=1,
            sqft_area=800,
            laundry_type='I',
            parking_spaces=1,
            heating=True,
            ac=True,
            move_in_date='2025-01-01',
            description='A nice apartment.',
            street_address='123 Main St',
            city='Testville',
            postal_code='12345',
            verification_status='P'
        )
        self.url = reverse('delete_listing', args=[self.listing.id])

    def test_delete_listing_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)  # Should redirect since it's a POST-only view

    def test_delete_listing_post(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Listing.objects.filter(id=self.listing.id).exists())

    def test_delete_listing_not_owner(self):
        other_user = get_user_model().objects.create_user(username='otheruser', password='otherpass', email='otheruser@example.com')
        self.client.login(username='otheruser', password='otherpass')
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 404)  # Should return 404 since the user is not the owner

class ViewAllListingsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('viewAllListings')
        self.user = get_user_model().objects.create_user(username='testuser', password='testpass')
        self.listing1 = Listing.objects.create(
            owner=self.user,
            price='1000.00',
            property_type='A',
            payment_type='C',
            bedrooms=2,
            bathrooms=1,
            sqft_area=800,
            laundry_type='I',
            parking_spaces=1,
            heating=True,
            ac=True,
            move_in_date='2025-01-01',
            description='A nice apartment.',
            street_address='123 Main St',
            city='Testville',
            postal_code='12345',
            verification_status='P'
        )
        self.listing2 = Listing.objects.create(
            owner=self.user,
            price='1500.00',
            property_type='H',
            payment_type='D',
            bedrooms=3,
            bathrooms=2,
            sqft_area=1200,
            laundry_type='S',
            parking_spaces=2,
            heating=True,
            ac=True,
            move_in_date='2025-02-01',
            description='A nice house.',
            street_address='456 Elm St',
            city='Testville',
            postal_code='12345',
            verification_status='P'
        )

    def test_view_all_listings_no_filters(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A nice apartment.')
        self.assertContains(response, 'A nice house.')

    def test_view_all_listings_with_filters(self):
        response = self.client.get(self.url, {'min_price': '1200'})
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'A nice apartment.')
        self.assertContains(response, 'A nice house.')

        response = self.client.get(self.url, {'max_price': '1200'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A nice apartment.')
        self.assertNotContains(response, 'A nice house.')

        response = self.client.get(self.url, {'location': 'Main'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A nice apartment.')
        self.assertNotContains(response, 'A nice house.')

        response = self.client.get(self.url, {'bedrooms': '3'})
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'A nice apartment.')
        self.assertContains(response, 'A nice house.')

        response = self.client.get(self.url, {'bathrooms': '2'})
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'A nice apartment.')
        self.assertContains(response, 'A nice house.')

        response = self.client.get(self.url, {'property_type': 'H'})
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'A nice apartment.')
        self.assertContains(response, 'A nice house.')