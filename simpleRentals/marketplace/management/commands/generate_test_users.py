from django.core.management.base import BaseCommand
from marketplace.models import MarketplaceUser, RoommateUser
from django.utils import timezone
from django.core.files.base import ContentFile
import requests, random, datetime, csv, os
from faker import Faker

fake = Faker()
DEFAULT_PASSWORD = "TestPass123!"

def fetch_avatar(seed: str) -> bytes | None:
    """
    Try to fetch a unique avatar image based on seed.
    Uses Pravatar (photoreal) with DiceBear fallback.
    """
    avatar_sources = [
        f"https://i.pravatar.cc/512?u={seed}",
        f"https://api.dicebear.com/7.x/adventurer/png?size=512&seed={seed}"
    ]
    for url in avatar_sources:
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return resp.content
        except Exception:
            continue
    return None

class Command(BaseCommand):
    help = "Generate 20 MarketplaceUser objects with same password, unique avatars, and save emails/passwords."

    def handle(self, *args, **kwargs):
        if MarketplaceUser.objects.count() >= 20:
            self.stdout.write(self.style.WARNING("Already have 20+ users, skipping generation."))
            return

        cities = ["Waterloo", "Toronto", "Ottawa", "Kitchener", "London", "Mississauga"]
        users = []
        credentials = []

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

            # Set same default password for all
            user.set_password(DEFAULT_PASSWORD)
            user.save()

            # Assign unique avatar if profile_picture exists
            if hasattr(user, "profile_picture"):
                seed = f"{user.username}-{user.email}"
                avatar_data = fetch_avatar(seed)
                if avatar_data:
                    user.profile_picture.save(
                        f"avatars/{user.username}.png",
                        ContentFile(avatar_data),
                        save=True
                    )

            credentials.append((email, DEFAULT_PASSWORD))
            users.append(user)

        # Assign roommate profiles to 11 users
        for u in random.sample(users, 11):
            RoommateUser.objects.create(
                user=u,
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

        # Save credentials to CSV
        out_path = os.path.join(os.getcwd(), "seeded_user_credentials.csv")
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["email", "password"])
            writer.writerows(credentials)

        self.stdout.write(self.style.SUCCESS(
            f"✅ 20 users generated (11 roommates), all with '{DEFAULT_PASSWORD}'.\n"
            f"🖼 Unique avatars assigned.\n"
            f"📄 Credentials saved to: {out_path}"
        ))