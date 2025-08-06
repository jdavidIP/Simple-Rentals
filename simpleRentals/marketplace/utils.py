from django.core.mail import send_mail
from django.conf import settings
from .tokens import email_verification_token
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from datetime import datetime

def send_password_reset_email(user, request):
    token = PasswordResetTokenGenerator().make_token(user)
    uid = user.pk
    frontend_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    subject = "SimpleRentals: Reset your password"

    # Plain text fallback
    message = f"""
Hi {user.email},

We received a request to reset the password for your SimpleRentals account.

To set a new password, click the link below:
{frontend_url}

If you did not request this, you can safely ignore this email.

Best regards,
The SimpleRentals Team
support@simplerentals.com
    """

    # HTML message
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f9; padding: 32px 0;">
      <div style="background: #fff; max-width: 460px; margin: 0 auto; border-radius: 12px; box-shadow: 0 3px 16px rgba(32,40,80,0.07); padding: 36px 36px 28px 36px;">
        <h2 style="color: #273561; font-weight: 700; margin-bottom: 24px; text-align: center;">
          SimpleRentals
        </h2>
        <p style="font-size: 1.08em; color: #222; margin-bottom: 12px;">
          Hi <b>{user.email}</b>,
        </p>
        <p style="font-size: 1.06em; color: #222; margin-bottom: 24px;">
          We received a request to reset the password for your SimpleRentals account.<br>
          To set a new password, click the button below:
        </p>
        <div style="text-align: center; margin-bottom: 26px;">
          <a href="{frontend_url}" style="
              display: inline-block;
              padding: 13px 32px;
              background: #273561;
              color: #fff !important;
              text-decoration: none;
              font-weight: 600;
              border-radius: 7px;
              letter-spacing: 0.3px;
              font-size: 1em;
              transition: background .2s;">
            Reset Password
          </a>
        </div>
        <p style="color: #777; font-size: 0.97em; margin-bottom: 14px;">
          If the button above doesn't work, copy and paste this link in your browser:<br>
          <a href="{frontend_url}" style="color: #3e5ea8;">{frontend_url}</a>
        </p>
        <p style="color: #888; font-size: 0.97em;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ececec; margin: 32px 0 18px 0;">
        <div style="text-align: center; color: #aaa; font-size: 0.96em;">
          Need help? Contact us at <a href="mailto:support@simplerentals.com" style="color: #7a8fff;">support@simplerentals.com</a><br>
          <span style="font-size: 0.93em;">© {datetime.now().year} SimpleRentals. All rights reserved.</span>
        </div>
      </div>
    </div>
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message
    )

def send_verification_email(user, request):
    token = email_verification_token.make_token(user)
    uid = user.pk
    frontend_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    subject = "Confirm your email address – SimpleRentals"

    # Plain text fallback
    message = f"""\
Hi {user.first_name or user.username},

Thank you for registering with SimpleRentals!

To activate your account, please confirm your email by clicking the link below:
{frontend_url}

If you did not create a SimpleRentals account, you can safely ignore this message.

Best regards,
The SimpleRentals Team
support@simplerentals.com
"""
    # HTML version
    html_message = f"""\
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;padding:32px 28px 24px 28px;border-radius:8px;box-shadow:0 4px 16px #0002;">
  <h2 style="color:#2D3A58;margin-bottom:8px;">Welcome to SimpleRentals!</h2>
  <p style="font-size:17px;color:#232b3e;">Hi <b>{user.first_name or user.username}</b>,</p>
  <p style="font-size:16px;margin-bottom:24px;">Thank you for registering with <b>SimpleRentals</b>. Please verify your email to activate your account:</p>
  <a href="{frontend_url}" style="background:#2D3A58;color:#fff;padding:13px 32px;border-radius:5px;text-decoration:none;font-weight:600;display:inline-block;font-size:16px;margin:18px 0 22px 0;">
    Verify Email
  </a>
  <p style="font-size:14px;color:#7b8393;margin-top:28px;">If you did not create a SimpleRentals account, please ignore this email.</p>
  <hr style="margin:34px 0 18px 0;border:none;border-top:1px solid #f0f0f5;">
  <div style="font-size:13px;color:#8c92a3;">
    Need help? Contact us at <a href="mailto:support@simplerentals.com" style="color:#2D3A58;">support@simplerentals.com</a>
  </div>
</div>
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message
    )

