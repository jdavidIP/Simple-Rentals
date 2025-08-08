# myapp/management/commands/generate_interactions.py
import random
from django.core.management.base import BaseCommand
from ...models import MarketplaceUser, RoommateUser, Listing, ListingInteraction, Favorites

class Command(BaseCommand):
    help = "Generate listing interactions and favourites for users with roommate profiles"

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

            # Step 1 — Determine user's preferred region based on past interactions
            past_interactions = ListingInteraction.objects.filter(user=user).select_related("listing")

            if past_interactions.exists():
                # Get most common city in past interactions
                cities = [interaction.listing.city for interaction in past_interactions]
                most_common_city = max(set(cities), key=cities.count)

                if most_common_city in self.REGION_GROUPS:
                    region_cities = self.REGION_GROUPS[most_common_city]
                else:
                    continue  # Skip if city is outside defined regions
            else:
                # Step 2 — Fall back to their profile city
                if not user.city or user.city not in self.REGION_GROUPS:
                    continue
                region_cities = self.REGION_GROUPS[user.city]

            # Step 3 — Get listings in that region
            listings_in_region = Listing.objects.filter(city__in=region_cities)
            if not listings_in_region.exists():
                continue

            # Step 4 — Generate more clicks to expand training data
            clicked_listings = random.sample(
                list(listings_in_region),
                min(5, listings_in_region.count())
            )
            for listing in clicked_listings:
                ListingInteraction.objects.create(
                    user=user,
                    listing=listing,
                    interaction_type="click"
                )

            # Step 5 — Generate favourites (subset of clicks)
            favourite_listings = random.sample(clicked_listings, min(2, len(clicked_listings)))
            fav_obj, _ = Favorites.objects.get_or_create(user=user)
            fav_obj.favorite_listings.add(*favourite_listings)

            for listing in favourite_listings:
                ListingInteraction.objects.create(
                    user=user,
                    listing=listing,
                    interaction_type="favourite"
                )

        self.stdout.write(self.style.SUCCESS("✅ Listing interactions and favourites generated/expanded successfully!"))
