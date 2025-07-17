from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser, Review

class TestReviewUpdateDeleteView(APITestCase):
    def setUp(self):
        self.reviewer = MarketplaceUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass1234"
        )
        self.other_user = MarketplaceUser.objects.create_user(
            username="charlie", email="charlie@example.com", password="pass1234"
        )
        self.reviewee = MarketplaceUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass1234"
        )
        self.review = Review.objects.create(
            reviewer=self.reviewer,
            reviewee=self.reviewee,
            rating=5,
            comment="Original comment",
            reviewee_role='T'
        )
        self.url = reverse('manage_review', kwargs={'pk': self.review.id})

    def test_update_review_by_owner(self):
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.patch(self.url, {"comment": "Updated comment"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.review.refresh_from_db()
        self.assertEqual(self.review.comment, "Updated comment")

    def test_update_review_unauthorized(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.url, {"rating": 3})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)