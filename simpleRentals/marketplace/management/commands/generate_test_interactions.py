# myapp/management/commands/generate_interactions.py
import random
from django.core.management.base import BaseCommand
from ...models import MarketplaceUser, RoommateUser, Listing, ListingInteraction, Favorites

class Command(BaseCommand):
    help = "Generate listing interactions and favourites for users with roommate profiles"

    # Region mapping: city -> [related cities]
    REGION_GROUPS = {
        "Waterloo": ["Waterloo", "Kitchener"],
        "Kitchener": ["Waterloo", "Kitchener"],
        "Toronto": ["Toronto", "Mississauga"],
        "Mississauga": ["Toronto", "Mississauga"],
        "Ottawa": ["Ottawa"],
        "London": ["London"],
    }

    def handle(self, *args, **kwargs):
        roommate_users = RoommateUser.objects.select_related("user").all()

        for roommate in roommate_users:
            user = roommate.user
            user_city = user.city

            if not user_city or user_city not in self.REGION_GROUPS:
                continue

            # Get listings in region
            region_cities = self.REGION_GROUPS[user_city]
            listings_in_region = Listing.objects.filter(city__in=region_cities)

            if not listings_in_region.exists():
                continue

            # Pick random subset for clicks
            clicked_listings = random.sample(list(listings_in_region), min(5, listings_in_region.count()))
            for listing in clicked_listings:
                ListingInteraction.objects.create(
                    user=user,
                    listing=listing,
                    interaction_type="click"
                )

            # Pick random subset for favourites (subset of clicked listings for realism)
            favourite_listings = random.sample(clicked_listings, min(2, len(clicked_listings)))

            fav_obj, _ = Favorites.objects.get_or_create(user=user)
            fav_obj.favorite_listings.add(*favourite_listings)

            # Also log as favourite interactions
            for listing in favourite_listings:
                ListingInteraction.objects.create(
                    user=user,
                    listing=listing,
                    interaction_type="favourite"
                )

        self.stdout.write(self.style.SUCCESS("✅ Listing interactions and favourites generated successfully!"))
