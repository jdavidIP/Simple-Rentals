from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.hashers import make_password
from marketplace.models import MarketplaceUser, RoommateUser
from django.utils import timezone
from django.conf import settings
from django.core.files.base import ContentFile
import requests, random, datetime, csv, os, sys
from faker import Faker

fake = Faker()
DEFAULT_PASSWORD = "TestPass123!"
SEED_DOMAIN = "example.com"  # seed users live under this domain

def fetch_avatar(seed: str) -> bytes | None:
    """
    Try to load a local profile picture from media/profile_pictures,
    otherwise fall back to downloading from avatar APIs.
    """
    local_dir = os.path.join(settings.MEDIA_ROOT, "profile_pictures")
    if os.path.exists(local_dir):
        choices = [f for f in os.listdir(local_dir) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        if choices:
            file_path = os.path.join(local_dir, random.choice(choices))
            with open(file_path, "rb") as f:
                return f.read()

    # Fallback to online sources
    sources = [
        f"https://i.pravatar.cc/512?u={seed}",
        f"https://api.dicebear.com/7.x/adventurer/png?size=512&seed={seed}",
    ]
    for url in sources:
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            return r.content
        except Exception:
            continue
    return None

class Command(BaseCommand):
    help = "Seed MarketplaceUser + RoommateUser with same password, unique avatars, and save credentials."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20, help="Number of users to create")
        parser.add_argument("--no-avatars", action="store_true", help="Skip downloading avatars")
        parser.add_argument("--clear", action="store_true",
                            help=f"Delete existing seeded users (emails ending with @{SEED_DOMAIN}) before seeding")
        parser.add_argument("--out", type=str, default="seeded_user_credentials.csv",
                            help="Where to write the credentials CSV (ignored if empty)")
        parser.add_argument("--print-creds", action="store_true",
                            help="Also print credentials to stdout (useful for Railway)")

    @transaction.atomic
    def handle(self, *args, **opts):
        count        = opts["count"]
        no_avatars   = opts["no_avatars"]
        do_clear     = opts["clear"]
        out_path     = opts["out"]
        print_creds  = opts["print_creds"]

        # Optionally clear only prior seeded users
        if do_clear:
            deleted, _ = MarketplaceUser.objects.filter(email__endswith=f"@{SEED_DOMAIN}").delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} seeded users (@{SEED_DOMAIN})."))

        cities = ["Waterloo", "Toronto", "Cambridge", "Kitchener", "London", "Mississauga"]

        # Track existing + newly generated to ensure uniqueness
        seen_usernames = set(MarketplaceUser.objects.values_list("username", flat=True))
        seen_emails    = set(MarketplaceUser.objects.values_list("email", flat=True))

        users_to_create = []
        credentials = []
        planned_emails = []

        for i in range(count):
            # Generate a unique username/email pair deterministically
            first = fake.first_name()
            last  = fake.last_name()

            base_username = f"{first.lower()}{i}"
            email_base    = f"{first.lower()}.{last.lower()}"
            username = base_username
            email    = f"{email_base}@{SEED_DOMAIN}"

            suffix = 0
            # Ensure uniqueness across DB + this batch
            while username in seen_usernames or email in seen_emails:
                suffix += 1
                username = f"{base_username}{suffix}"
                email    = f"{email_base}{suffix}@{SEED_DOMAIN}"

            seen_usernames.add(username)
            seen_emails.add(email)
            planned_emails.append(email)

            budget_min = random.randint(500, 900)
            budget_max = budget_min + random.randint(200, 800)

            users_to_create.append(MarketplaceUser(
                username=username,
                first_name=first,
                last_name=last,
                email=email,
                age=random.randint(18, 45),
                sex=random.choice(["M", "F", "O"]),
                city=random.choice(cities),
                preferred_location=random.choice(cities),
                id_verification_status=random.choice(["V", "P", "U"]),
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
                facebook_link=f"https://facebook.com/{first.lower()}.{last.lower()}",
                instagram_link=f"https://instagram.com/{first.lower()}_{last.lower()}",
                password=make_password(DEFAULT_PASSWORD),
            ))
            credentials.append((email, DEFAULT_PASSWORD))

        # Create users in bulk
        MarketplaceUser.objects.bulk_create(users_to_create, batch_size=500)

        created_users = list(MarketplaceUser.objects.filter(email__in=planned_emails))

        # Attach avatars (needs PKs)
        if not no_avatars:
            for user in created_users:
                if hasattr(user, "profile_picture"):
                    seed = f"{user.username}-{user.email}"
                    blob = fetch_avatar(seed)
                    if blob:
                        user.profile_picture.save(f"{user.username}.png", ContentFile(blob), save=True)

        # Create roommate profiles for ~11 (or 55%) of them
        k = min(11, max(1, int(round(0.55 * len(created_users)))))
        roommate_sample = random.sample(created_users, k=k)
        roommate_objs = []
        for u in roommate_sample:
            roommate_objs.append(
                RoommateUser(
                    user=u,
                    description=fake.paragraph(nb_sentences=3),
                    move_in_date=timezone.now().date() + datetime.timedelta(days=random.randint(5, 90)),
                    stay_length=random.choice([6, 12, 24]),
                    occupation=random.choice(["S", "E", "N"]),
                    roommate_budget=random.randint(600, 1500),
                    smoke_friendly=random.choice([True, False]),
                    cannabis_friendly=random.choice([True, False]),
                    pet_friendly=random.choice([True, False]),
                    couple_friendly=random.choice([True, False]),
                    gender_preference=random.choice(["F", "M", "O"]),
                    open_to_message=True,
                )
            )
        RoommateUser.objects.bulk_create(roommate_objs, batch_size=500)

        # Output credentials
        if out_path:
            try:
                with open(out_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["email", "password"])
                    writer.writerows(credentials)
                self.stdout.write(self.style.NOTICE(f"Credentials saved to: {out_path}"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Could not write CSV: {e}"))

        if print_creds:
            # Pretty print to stdout
            self.stdout.write("\nEMAIL, PASSWORD")
            for e, p in credentials:
                self.stdout.write(f"{e}, {p}")
            self.stdout.write("")

        self.stdout.write(self.style.SUCCESS(
            f"✅ Generated {len(created_users)} users (password '{DEFAULT_PASSWORD}'). "
            f"{len(roommate_objs)} roommate profiles created. "
            f"Avatars: {'skipped' if no_avatars else 'attached (best-effort)'}."
        ))
