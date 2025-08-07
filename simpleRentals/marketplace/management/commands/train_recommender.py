from django.core.management.base import BaseCommand
from marketplace.models import ListingInteraction, MarketplaceUser, Listing
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import os

class Command(BaseCommand):
    help = "Trains the recommendation model and saves it to disk"

    def handle(self, *args, **kwargs):
        interactions = ListingInteraction.objects.select_related('user', 'listing')

        rows = []
        for i in interactions:
            user = i.user
            listing = i.listing

            # Only include if budget is set and price is within budget
            if user.budget_min is not None and user.budget_max is not None:
                if not (user.budget_min <= listing.price <= user.budget_max):
                    continue

            rows.append({
                'user_id': user.id,
                'preferred_location': hash(user.preferred_location or ""),
                'budget_min': user.budget_min or 0,
                'budget_max': user.budget_max or 0,
                'listing_price': float(listing.price),
                'listing_lat': listing.latitude,
                'listing_lng': listing.longitude,
                'pet_friendly': int(listing.pet_friendly),

                # Amenities and Utilities
                'heating': int(listing.heating),
                'ac': int(listing.ac),
                'fridge': int(listing.fridge),
                'laundry_type': {'I': 2, 'S': 1, 'N': 0}.get(listing.laundry_type, -1),
                'heat': int(listing.heat),
                'hydro': int(listing.hydro),
                'water': int(listing.water),
                'internet': int(listing.internet),
                'furnished': int(listing.furnished),
                'shareable': int(listing.shareable),

                'score': 1 if i.interaction_type == 'favourite' else 0.5,
            })

        df = pd.DataFrame(rows)

        if df.empty:
            self.stdout.write(self.style.WARNING("No data to train the model. Skipping."))
            return

        X = df.drop('score', axis=1)
        y = df['score']

        model = RandomForestRegressor()
        model.fit(X, y)

        os.makedirs("ml_model", exist_ok=True)
        joblib.dump(model, 'ml_model/recommender.pkl')

        self.stdout.write(self.style.SUCCESS("Model trained and saved."))
