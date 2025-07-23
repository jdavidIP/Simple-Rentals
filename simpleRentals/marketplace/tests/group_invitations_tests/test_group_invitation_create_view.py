from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser, RoommateUser, Listing, Group, GroupInvitation
from datetime import date

class TestGroupInvitationCreateView(APITestCase):
    def setUp(self):
        self.owner = MarketplaceUser.objects.create_user(username='owner', email='owner@example.com', password='pass1234')
        self.inviter = MarketplaceUser.objects.create_user(username='inviter', email='inviter@example.com', password='pass1234')
        self.invitee = MarketplaceUser.objects.create_user(username='invitee', email='invitee@example.com', password='pass1234')
        self.inviter_roommate = RoommateUser.objects.create(
            user=self.inviter,
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
        self.invitee_roommate = RoommateUser.objects.create(
            user=self.invitee,
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
        self.owner_roommate = RoommateUser.objects.create(
            user=self.owner,
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
            owner=self.owner,
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
        self.group = Group.objects.create(name='Test Group', listing=self.listing, owner=self.inviter_roommate, move_in_date='2025-09-01', group_status='O')
        
        self.data = {
            "group": self.group.id,
            "invited_user": self.invitee_roommate.id
        }

        self.url = reverse('invite_group', kwargs={'pk': self.group.id})
        self.client.force_authenticate(user=self.inviter)

    def test_create_invitation_success(self):
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['invited_user'], self.invitee_roommate.id)

    def test_create_invitation_fail_inviting_owner(self):
        data = self.data
        data["invited_user"] = self.owner_roommate.id
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('The owner of the listing cannot be invited', str(response.data))

    def test_create_invitation_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_invitation_invalid_user(self):
        data = self.data
        data["invited_user"] = 999
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid pk', str(response.data))
