from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from marketplace.models import RoommateUser
from datetime import date

class RoommateListViewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='john', email='john@example.com', password='password123'
        )
        self.roommate = RoommateUser.objects.create(
            user=self.user,
            description="Looking for roommate",
            move_in_date=date.today(),
            stay_length=6,
            occupation='E',
            roommate_budget=1000,
            smoke_friendly=True,
            cannabis_friendly=False,
            pet_friendly=True,
            couple_friendly=False,
            gender_preference='F'
        )

        self.url = reverse('viewAllRoommates')

    def test_list_with_filters(self):
        response = self.client.get(self.url, {'pet_friendly': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item['pet_friendly'] is True for item in response.data))

    def test_list_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_excludes_self(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        ids = [item['user']['id'] for item in response.data]
        self.assertNotIn(self.user.id, ids)

    def test_list_invalid_boolean_filter(self):
        response = self.client.get(self.url, {'pet_friendly': 'maybe'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
