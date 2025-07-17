from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from marketplace.models import RoommateUser
from datetime import date

class CreateRoommateViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='alice', email='alice@example.com', password='password123'
        )
        self.client.force_authenticate(user=self.user)

        self.data = {
            "description": "Looking for a place",
            "move_in_date": date.today(),
            "stay_length": 12,
            "occupation": "E",
            "roommate_budget": 850.00,
            "smoke_friendly": False,
            "cannabis_friendly": False,
            "pet_friendly": True,
            "couple_friendly": False,
            "gender_preference": "M",
            "open_to_message": True
        }

        self.url = reverse('post_roommate')

    def test_create_roommate_invalid(self):
        response = self.client.post(self.url, data={})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('description', response.data)

    def test_create_roommate_valid(self):
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RoommateUser.objects.count(), 1)

    def test_create_roommate_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
