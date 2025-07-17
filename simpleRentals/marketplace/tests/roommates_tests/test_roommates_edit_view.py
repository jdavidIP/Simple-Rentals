from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from marketplace.models import RoommateUser
from datetime import date

class RoommateEditViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='bob', email='bob@example.com', password='password123'
        )
        self.other_user = get_user_model().objects.create_user(
            username='alice', email='alice@example.com', password='password123'
        )
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
        self.client.force_authenticate(user=self.user)

        self.url = reverse('edit_roommate', kwargs={'pk': self.roommate.id})

    def test_edit_own_roommate_profile(self):
        response = self.client.patch(self.url, {"description": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.roommate.refresh_from_db()
        self.assertEqual(self.roommate.description, "Updated")

    def test_edit_other_users_roommate_profile(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.url, {"description": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_edit_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.patch(self.url, {"description": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

