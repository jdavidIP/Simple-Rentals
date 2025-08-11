# myapp/management/commands/generate_interactions.py
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.db.models import Count
from ...models import (
    MarketplaceUser, RoommateUser, Listing,
    ListingInteraction, Favorites
)

class Command(BaseCommand):
    help = "Generate listing interactions (click/favourite) for users with roommate profiles."

    REGION_GROUPS = {
        "Waterloo": ["Waterloo", "Kitchener"],
        "Kitchener": ["Waterloo", "Kitchener"],
        "Toronto": ["Toronto", "Mississauga"],
        "Mississauga": ["Toronto", "Mississauga"],
        "Ottawa": ["Ottawa"],
        "London": ["London"],
    }

    def add_arguments(self, parser):
        parser.add_argument("--seed", type=int, default=None, help="Random seed.")
        parser.add_argument("--clear", action="store_true",
                            help="Delete all ListingInteraction rows and clear Favorites first.")
        parser.add_argument("--clicks", type=int, default=5,
                            help="Max clicks to add per roommate user (default 5).")
        parser.add_argument("--favs", type=int, default=2,
                            help="Max favourites (subset of clicks) per roommate user (default 2).")
        parser.add_argument("--exclude-owned", action="store_true",
                            help="Do not interact with listings owned by the same user.")
        parser.add_argument("--days", type=int, default=60,
                            help="Spread timestamps across the past N days (default 60).")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["seed"] is not None:
            random.seed(opts["seed"])

        clicks_per_user = max(0, opts["clicks"])
        favs_per_user   = max(0, min(opts["favs"], clicks_per_user))
        spread_days     = max(0, opts["days"])

        if opts["clear"]:
            ListingInteraction.objects.all().delete()
            Favorites.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared interactions and favourites."))

        roommates = (RoommateUser.objects
                     .select_related("user")
                     .order_by("id"))
        if not roommates.exists():
            self.stdout.write(self.style.WARNING("No roommate users found. Seed users first."))
            return

        listings = list(Listing.objects.select_related("owner"))
        if not listings:
            self.stdout.write(self.style.WARNING("No listings found. Seed listings first."))
            return

        now = timezone.now()
        total_new_clicks = 0
        total_new_favs = 0

        # Build quick lookup of existing interactions to avoid duplicates on reruns
        existing_pairs = set(
            ListingInteraction.objects.values_list("user_id", "listing_id", "interaction_type")
        )

        all_click_objects = []
        fav_updates = []  # (Favorites instance, [listing_ids])

        for rm in roommates:
            user = rm.user

            # 1) Choose region
            # Prefer past-interaction region (most common city)
            past = (ListingInteraction.objects
                    .filter(user=user)
                    .select_related("listing")
                    .values("listing__city")
                    .annotate(c=Count("id"))
                    .order_by("-c"))
            if past:
                most_common_city = past[0]["listing__city"]
                region_cities = self.REGION_GROUPS.get(most_common_city)
            else:
                # Fallback to user's preferred_location or city
                region_cities = (self.REGION_GROUPS.get(getattr(user, "preferred_location", ""), None)
                                 or self.REGION_GROUPS.get(getattr(user, "city", ""), None))

            if not region_cities:
                # Last resort: pick any region group
                region_cities = random.choice(list(self.REGION_GROUPS.values()))

            # 2) Candidate listings in region
            candidates = [l for l in listings if l.city in region_cities]
            if opts["exclude_owned"]:
                candidates = [l for l in candidates if l.owner_id != user.id]
            if not candidates:
                continue

            # 3) Choose clicks
            k_clicks = min(clicks_per_user, len(candidates))
            clicked = random.sample(candidates, k_clicks) if k_clicks > 0 else []

            # 4) Create click interactions (dedupbed)
            for lst in clicked:
                key = (user.id, lst.id, "click")
                if key in existing_pairs:
                    continue
                existing_pairs.add(key)

                ts = now
                if spread_days > 0:
                    minutes_back = random.randint(0, spread_days * 24 * 60)
                    ts = now - timedelta(minutes=minutes_back)

                all_click_objects.append(ListingInteraction(
                    user=user, listing=lst, interaction_type="click", timestamp=ts if hasattr(ListingInteraction, "created_at") else None
                ))
                total_new_clicks += 1

            # 5) Choose favourites as subset of clicked
            k_favs = min(favs_per_user, len(clicked))
            favs = random.sample(clicked, k_favs) if k_favs > 0 else []

            # Add to Favorites (avoid duplicates)
            if favs:
                fav_obj, _ = Favorites.objects.get_or_create(user=user)
                fav_updates.append((fav_obj, [l.id for l in favs]))

                for lst in favs:
                    key = (user.id, lst.id, "favourite")
                    if key in existing_pairs:
                        continue
                    existing_pairs.add(key)

                    ts = now
                    if spread_days > 0:
                        minutes_back = random.randint(0, spread_days * 24 * 60)
                        ts = now - timedelta(minutes=minutes_back)

                    all_click_objects.append(ListingInteraction(
                        user=user, listing=lst, interaction_type="favourite", timestamp=ts if hasattr(ListingInteraction, "created_at") else None
                    ))
                    total_new_favs += 1

        # 6) Bulk insert new interactions
        if all_click_objects:
            ListingInteraction.objects.bulk_create(all_click_objects, batch_size=1000)

        # 7) Add favourites to M2M in batches
        for fav_obj, listing_ids in fav_updates:
            fav_obj.favorite_listings.add(*listing_ids)

        self.stdout.write(self.style.SUCCESS(
            f"✅ Interactions generated. Clicks: {total_new_clicks}, Favourites: {total_new_favs}."
        ))
