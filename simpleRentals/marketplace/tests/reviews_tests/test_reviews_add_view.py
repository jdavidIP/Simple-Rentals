from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser, Review

class TestReviewPosting(APITestCase):
    def setUp(self):
        self.reviewer = MarketplaceUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass1234"
        )
        self.reviewee = MarketplaceUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass1234"
        )
        self.url = reverse('post_review', kwargs={'pk': self.reviewee.id})
        self.client.force_authenticate(user=self.reviewer)

    def test_post_review_valid(self):
        data = {
            "rating": 5,
            "comment": "Great experience!",
            "reviewee": self.reviewee.id,
            "reviewee_role": "T"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 1)

    def test_post_duplicate_review(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewee=self.reviewee,
            rating=5,
            comment="Original review",
            reviewee_role='T'
        )
        data = {
            "rating": 4,
            "comment": "Trying again",
            "reviewee": self.reviewee.id,
            "reviewee_role": "T"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You have already posted a review", str(response.data[0]))

    def test_post_review_to_self(self):
        url = reverse('post_review', kwargs={'pk': self.reviewer.id})
        data = {
            "rating": 3,
            "comment": "Self review?",
            "reviewee": self.reviewer.id,
            "reviewee_role": "T"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You cannot review yourself", str(response.data))
