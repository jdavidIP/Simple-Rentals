from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from marketplace.models import RoommateUser
from datetime import date

class RoommateDetailViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='jane', email='jane@example.com', password='password123'
        )
        self.roommate = RoommateUser.objects.create(
            user=self.user,
            description="Need a place soon",
            move_in_date=date.today(),
            stay_length=3,
            occupation='S',
            roommate_budget=800,
            smoke_friendly=False,
            cannabis_friendly=False,
            pet_friendly=False,
            couple_friendly=False,
            gender_preference='M'
        )
        self.client.force_authenticate(user=self.user)

        self.url = reverse('view_roommate', kwargs={'pk': self.roommate.id})

    def test_retrieve_roommate_authenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.roommate.id)

    def test_retrieve_roommate_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_roommate(self):
        url = reverse('view_roommate', kwargs={'pk': 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
