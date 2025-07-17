from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser, Review

class TestReviewListView(APITestCase):
    def setUp(self):
        self.user1 = MarketplaceUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass1234"
        )
        self.user2 = MarketplaceUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass1234"
        )
        self.review = Review.objects.create(
            reviewer=self.user1,
            reviewee=self.user2,
            rating=4,
            comment="Nice landlord",
            reviewee_role='L'
        )
        self.list_url = reverse('view_reviews')
        self.detail_url = reverse('view_review', kwargs={'pk': self.review.id})
        self.client.force_authenticate(user=self.user1)

    def test_list_reviews_by_reviewer(self):
        response = self.client.get(self.list_url, {'reviewer': self.user1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_reviews_by_reviewee(self):
        response = self.client.get(self.list_url, {'reviewee': self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_reviews_missing_filters(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Reviewer/Reviewee", str(response.data))

    def test_view_review_detail_valid(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.review.id)

    def test_view_review_detail_not_found(self):
        url = reverse('view_review', kwargs={'pk': 999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
