import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.core.exceptions import FieldDoesNotExist

from marketplace.models import MarketplaceUser
from ...models import Listing

# Real addresses + coords (Waterloo/Kitchener)
ADDRESSES = [
    ("101 King St N", "Waterloo",   "N2J 2X5", 43.46888025416226, -80.52353610327047),
    ("75 University Ave W", "Waterloo", "N2L 3C5", 43.4733828731456, -80.53032183210595),
    ("150 King St S", "Waterloo",  "N2J 1P6", 43.462198768068134, -80.52073863699293),
    ("50 Westmount Rd N", "Waterloo", "N2L 2R5", 43.461714982625935, -80.53704131676398),
    ("255 King St W", "Kitchener", "N2G 1B1", 43.45139884670024,  -80.4936278312993),
    ("20 Queen St N", "Kitchener", "N2H 2G8", 43.45064998448576,  -80.48893993193786),
    ("150 Caroline St S", "Waterloo", "N2L 0A5", 43.459657322632296, -80.51939217362691),
    ("200 University Ave W", "Waterloo", "N2L 3G1", 43.472175073193085, -80.55010826013438),
    ("85 Willis Way", "Waterloo",  "N2J 4A8", 43.46283991996274,  -80.52307304479086),
    ("700 Strasburg Rd", "Kitchener", "N2E 2M2", 43.41309054559533,  -80.47884131660422),
    ("375 King St N", "Waterloo",  "N2J 2Z5", 43.48246615579352,  -80.52708601780596),
    ("50 Bridgeport Rd E", "Waterloo", "N2J 2J5", 43.46858464786343,  -80.51913840309696),
    ("250 Phillip St", "Waterloo", "N2L 3G1", 43.473138328767945, -80.53672174664233),
    ("20 Erb St E", "Waterloo",    "N2J 1L6", 43.465634052809484, -80.52078168897062),
    ("305 King St E", "Kitchener", "N2G 2L3", 43.44743790743493,  -80.48408434543074),
    ("25 Regina St N", "Waterloo", "N2J 2Z8", 43.46797093076544,  -80.52216464664251),
    ("45 Columbia St W", "Waterloo","N2L 3K4", 43.480295210966794, -80.52996527362608),
    ("10 Allen St E", "Waterloo",  "N2J 1J2", 43.46041484639303,  -80.51908718897084),
]

PROPERTY_TYPES = ['H', 'A', 'C', 'T']
PAYMENT_TYPES  = ['C', 'D', 'I', 'P', 'X']
LAUNDRY_TYPES  = ['I', 'S']

def model_has_field(model, name: str) -> bool:
    try:
        model._meta.get_field(name)
        return True
    except FieldDoesNotExist:
        return False

def get_geo_field_names():
    """Return ('lat_field','lng_field') used by Listing, or raise if none exist."""
    if model_has_field(Listing, "lat") and model_has_field(Listing, "lng"):
        return ("lat", "lng")
    if model_has_field(Listing, "latitude") and model_has_field(Listing, "longitude"):
        return ("latitude", "longitude")
    raise CommandError(
        "Listing model has no lat/lng fields. Expected 'lat'/'lng' or 'latitude'/'longitude'."
    )

class Command(BaseCommand):
    help = "Generate listings (all with lat/lng) for users without a roommate profile."

    def add_arguments(self, parser):
        parser.add_argument("--count-per-owner", type=int, default=1,
                            help="Listings to create per eligible owner (default 1).")
        parser.add_argument("--clear", action="store_true",
                            help="Delete ALL existing listings before seeding.")

    @transaction.atomic
    def handle(self, *args, **opts):
        count_per_owner = max(1, opts["count_per_owner"])
        clear = opts["clear"]

        lat_field, lng_field = get_geo_field_names()

        if clear:
            Listing.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing listings."))

        owners = list(MarketplaceUser.objects.filter(roommate_profile__isnull=True))
        if not owners:
            self.stdout.write(self.style.ERROR("No eligible owners (non-roommate users). Seed users first."))
            return

        random.shuffle(owners)
        random.shuffle(ADDRESSES)

        listings_created = 0
        addr_idx = 0
        total_needed = len(owners) * count_per_owner

        if total_needed > len(ADDRESSES):
            self.stdout.write(self.style.WARNING(
                f"Requested {total_needed} listings but only {len(ADDRESSES)} address coords available. "
                "Will create as many as addresses allow."
            ))
            total_needed = len(ADDRESSES)

        for owner in owners:
            for _ in range(count_per_owner):
                if addr_idx >= total_needed:
                    break
                street, city, postal, lat, lng = ADDRESSES[addr_idx]
                addr_idx += 1

                # Build object ensuring lat/lng present
                kwargs = dict(
                    price=random.randint(900, 3500),
                    property_type=random.choice(PROPERTY_TYPES),
                    payment_type=random.choice(PAYMENT_TYPES),
                    bedrooms=random.randint(1, 4),
                    bathrooms=random.randint(1, 3),
                    sqft_area=random.randint(500, 2500),
                    parking_spaces=random.randint(0, 3),
                    pet_friendly=random.choice([True, False]),
                    verification_status=random.choice(['V', 'P', 'U']),
                    move_in_date=date.today() + timedelta(days=random.randint(5, 60)),
                    description=f"Beautiful {city} rental property close to transit and amenities.",
                    shareable=random.choice([True, False]),
                    heating=True,
                    ac=random.choice([True, False]),
                    extra_amenities=random.choice(["Gym, Pool", "Rooftop Patio", "Storage Locker", ""]),
                    laundry_type=random.choice(LAUNDRY_TYPES),
                    fridge=True,
                    street_address=street,
                    city=city,
                    postal_code=postal,
                    heat=True,
                    hydro=random.choice([True, False]),
                    water=True,
                    internet=random.choice([True, False]),
                    furnished=random.choice([True, False]),
                    owner=owner,
                    **{lat_field: lat, lng_field: lng}
                )

                Listing.objects.create(**kwargs)
                listings_created += 1

            if addr_idx >= total_needed:
                break

        self.stdout.write(self.style.SUCCESS(
            f"Created {listings_created} listings. All include {lat_field}/{lng_field}."
        ))
