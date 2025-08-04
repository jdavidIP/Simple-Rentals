from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from marketplace.models import MarketplaceUser, Listing, Conversation, Message

class TestStartConversationView(APITestCase):
    def setUp(self):
        self.landlord = MarketplaceUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass1234"
        )
        self.tenant = MarketplaceUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass1234"
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
        self.url = reverse('start_conversation', args=[self.listing.id])
        self.client.force_authenticate(user=self.tenant)

    def test_start_conversation_with_landlord(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        participant_ids = [p['id'] for p in response.data['participants']]
        self.assertIn(self.tenant.id, participant_ids)
        self.assertIn(self.landlord.id, participant_ids)

    def test_start_conversation_with_self(self):
        self.client.force_authenticate(user=self.landlord)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_duplicate_conversation(self):
        conversation = Conversation.objects.create(listing=self.listing)
        conversation.participants.set([self.tenant, self.landlord])

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)