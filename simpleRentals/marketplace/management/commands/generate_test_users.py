
from django.core.management.base import BaseCommand
from marketplace.models import MarketplaceUser, RoommateUser
from django.utils import timezone
import random
import datetime
from faker import Faker

fake = Faker()

class Command(BaseCommand):
    help = "Generate 20 MarketplaceUser objects with realistic data, 11 with RoommateUser profiles"

    def handle(self, *args, **kwargs):
        # Ensure we don't duplicate if run multiple times
        if MarketplaceUser.objects.count() >= 20:
            self.stdout.write(self.style.WARNING("Already have 20+ users, skipping generation."))
            return

        cities = ["Waterloo", "Toronto", "Ottawa", "Kitchener", "London", "Mississauga"]

        users = []
        for i in range(20):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = f"{first_name.lower()}.{last_name.lower()}@example.com"

            budget_min = random.randint(500, 900)
            budget_max = budget_min + random.randint(200, 800)

            user = MarketplaceUser.objects.create(
                username=f"{first_name.lower()}{i}",
                first_name=first_name,
                last_name=last_name,
                email=email,
                age=random.randint(18, 45),
                sex=random.choice(['M', 'F', 'O']),
                city=random.choice(cities),
                preferred_location=random.choice(cities),
                id_verification_status=random.choice(['V', 'P', 'U']),
                budget_min=budget_min,
                budget_max=budget_max,
                yearly_income=random.randint(30000, 120000),
                phone_number=f"+1{random.randint(2000000000, 9999999999)}",
                phone_verified=random.choice([True, False]),
                email_verified=True,
                last_login=timezone.now() - datetime.timedelta(days=random.randint(0, 30)),
                terms_accepted=True,
                receive_email_notifications=True,
                receive_sms_notifications=random.choice([True, False]),
                facebook_link=f"https://facebook.com/{first_name.lower()}.{last_name.lower()}",
                instagram_link=f"https://instagram.com/{first_name.lower()}_{last_name.lower()}",
            )
            user.set_password("TestPass123!")  # Default password for testing
            user.save()
            users.append(user)

        # Assign roommate profiles to 11 users
        roommate_users = random.sample(users, 11)
        for user in roommate_users:
            RoommateUser.objects.create(
                user=user,
                description=fake.paragraph(nb_sentences=3),
                move_in_date=timezone.now().date() + datetime.timedelta(days=random.randint(5, 90)),
                stay_length=random.choice([6, 12, 24]),
                occupation=random.choice(['S', 'E', 'N']),
                roommate_budget=random.randint(600, 1500),
                smoke_friendly=random.choice([True, False]),
                cannabis_friendly=random.choice([True, False]),
                pet_friendly=random.choice([True, False]),
                couple_friendly=random.choice([True, False]),
                gender_preference=random.choice(['F', 'M', 'O']),
                open_to_message=True
            )

        self.stdout.write(self.style.SUCCESS("✅ 20 users generated, with 11 having roommate profiles."))
