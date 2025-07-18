from django.core.mail import send_mail
from django.conf import settings
from .tokens import email_verification_token

def send_verification_email(user, request):
    token = email_verification_token.make_token(user)
    uid = user.pk
    frontend_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    subject = "Confirm your email address"
    message = f"Hi {user.username},\n\nPlease verify your email by clicking the following link:\n{frontend_url}\n\nIf you didn't sign up, just ignore this email."
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])