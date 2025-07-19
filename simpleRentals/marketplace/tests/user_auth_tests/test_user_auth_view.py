from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from marketplace.models import MarketplaceUser
from rest_framework_simplejwt.tokens import RefreshToken

class UserAuthTests(APITestCase):
    def setUp(self):
        # Create a user to test login and profile views
        self.user = MarketplaceUser.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpass123",
            email_verified=True
        )
        self.login_url = reverse("login")
        self.register_url = reverse("register")
        self.profile_url = reverse("profile", kwargs={"pk": self.user.pk})
        self.edit_profile_url = reverse("edit_profile")
        self.current_user_url = reverse("profile_self")
        self.logout_url = reverse("logout")

    def test_user_registration(self):
        data = {
            "email": "newuser@example.com",
            "password": "newpass123",
            "password_confirmation": "newpass123",
            "first_name": "New",
            "last_name": "User",
            "budget_max": "1000.00", 
            "phone_number": "+1-123-456-7890",
            "terms_accepted": True
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MarketplaceUser.objects.filter(email="newuser@example.com").exists())

    def test_user_registration_password_mismatch(self):
        data = {
            "email": "mismatch@example.com",
            "password": "pass1",
            "password_confirmation": "pass2",
            "first_name": "Mismatch",
            "last_name": "User",
            "budget_max": "1000.00", 
            "phone_number": "+1-123-456-7890",
            "terms_accepted": True
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_user_registration_missing_terms(self):
        data = {
            "email": "noterms@example.com",
            "password": "testpass",
            "password_confirmation": "testpass",
            "first_name": "No",
            "budget_max": "1000.00", 
            "last_name": "Terms",
            "phone_number": "+1-123-456-7890",
            # "terms_accepted" omitted
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("terms_accepted", response.data)

    def test_user_login_email_verified(self):
        data = {
            "email": "testuser@example.com",
            "password": "testpass123"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["message"], "Login successful")

    def test_user_login_email_not_verified(self):
        self.user.email_verified = False
        self.user.save() 
        data = {
            "email": "testuser@example.com",
            "password": "testpass123"
        }

        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            response.data["detail"],
            "Email not verified. Please check your inbox or resend the verification email."
        )


    def test_user_login_invalid_password(self):
        data = {
            "email": "testuser@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)