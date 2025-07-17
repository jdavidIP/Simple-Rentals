from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser, RoommateUser, Listing, Group, GroupInvitation
from django.utils.timezone import now

class TestGroupInvitationUpdateView(APITestCase):
    def setUp(self):
        self.user = MarketplaceUser.objects.create_user(username='invitee', email='invitee@example.com', password='pass1234')
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
        self.group = Group.objects.create(name='Test Group', listing=self.listing, owner=self.roommate, move_in_date='2025-09-01', group_status='O')
        self.invitation = GroupInvitation.objects.create(group=self.group, invited_user=self.roommate, invited_by=self.roommate)
        self.url = reverse('group-invitation-update', kwargs={'pk': self.invitation.id})
        self.client.force_authenticate(user=self.user)

    def test_accept_invitation(self):
        response = self.client.patch(self.url, {'accepted': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invitation.refresh_from_db()
        self.assertTrue(self.invitation.accepted)

    def test_decline_invitation(self):
        response = self.client.patch(self.url, {'accepted': False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invitation.refresh_from_db()
        self.assertFalse(self.invitation.accepted)

    def test_update_invitation_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.patch(self.url, {'accepted': True})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_invitation_invalid_id(self):
        self.client.force_authenticate(user=self.user)
        invalid_url = reverse('group-invitation-update', kwargs={'pk': 999})
        response = self.client.patch(invalid_url, {'accepted': True})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
