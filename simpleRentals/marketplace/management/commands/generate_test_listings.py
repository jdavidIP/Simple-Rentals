# rentals/management/commands/generate_listings.py
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import Listing, MarketplaceUser

class Command(BaseCommand):
    help = "Generate 20 listings for users without a roommate profile."

    def handle(self, *args, **kwargs):
        # City to address mapping
        addresses = {
            "Waterloo": [
                ("101 King St N", "N2J 2X5"),
                ("250 Columbia St W", "N2L 0E6"),
                ("35 University Ave E", "N2J 2W6")
            ],
            "Toronto": [
                ("123 Queen St W", "M5H 2M9"),
                ("88 Spadina Ave", "M5V 2J4"),
                ("200 Bloor St E", "M4W 1A8")
            ],
            "Ottawa": [
                ("150 Elgin St", "K2P 1L4"),
                ("99 Bank St", "K1P 6B9"),
                ("300 Laurier Ave W", "K1P 6M9")
            ],
            "Kitchener": [
                ("10 King St E", "N2G 2K4"),
                ("200 Frederick St", "N2H 2M7"),
                ("50 Ottawa St S", "N2G 3S7")
            ],
            "London": [
                ("300 Dundas St", "N6B 1T6"),
                ("88 Wharncliffe Rd N", "N6H 2B4"),
                ("150 Wellington St", "N6B 2K9")
            ],
            "Mississauga": [
                ("100 City Centre Dr", "L5B 2C9"),
                ("25 Burnhamthorpe Rd W", "L5B 3Y4"),
                ("50 Eglinton Ave W", "L5R 3P5")
            ]
        }

        property_types = ['H', 'A', 'C', 'T']
        payment_types = ['C', 'D', 'I', 'P', 'X']
        laundry_types = ['I', 'S']

        roommate_user_ids = set(
            MarketplaceUser.objects.filter(roommate_profile__isnull=False).values_list('id', flat=True)
        )
        all_user_ids = set(range(1, 21))
        non_roommate_users = all_user_ids - roommate_user_ids

        listings_created = 0
        for user_id in non_roommate_users:
            owner = MarketplaceUser.objects.get(id=user_id)
            for _ in range(1):  # 1 listing per user
                city = random.choice(list(addresses.keys()))
                street_address, postal_code = random.choice(addresses[city])

                listing = Listing.objects.create(
                    price=random.randint(900, 3500),
                    property_type=random.choice(property_types),
                    payment_type=random.choice(payment_types),
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
                    laundry_type=random.choice(laundry_types),
                    fridge=True,
                    street_address=street_address,
                    city=city,
                    postal_code=postal_code,
                    heat=True,
                    hydro=random.choice([True, False]),
                    water=True,
                    internet=random.choice([True, False]),
                    furnished=random.choice([True, False]),
                    owner=owner
                )
                listings_created += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Created {listings_created} listings."))
