from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from marketplace.models import MarketplaceUser, Listing, Conversation, Message

class TestConversationDetailView(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass1234"
        )
        self.other_user = MarketplaceUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass1234"
        )
        listing = Listing.objects.create(
            owner=self.other_user,
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
        self.conversation = Conversation.objects.create(listing=listing)
        self.conversation.participants.add(self.user, self.other_user)
        self.url = reverse('conversation_detail', args=[self.conversation.id])
        self.client.force_authenticate(user=self.user)

    def test_view_conversation_detail_authorized(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.conversation.id)

    def test_view_conversation_detail_unauthorized(self):
        user3 = MarketplaceUser.objects.create_user(
            username="charlie", email="charlie@example.com", password="pass1234"
        )
        self.client.force_authenticate(user=user3)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
