# myapp/management/commands/generate_reviews.py
import random
from django.core.management.base import BaseCommand
from ...models import MarketplaceUser, Review

class Command(BaseCommand):
    help = "Generate random reviews between MarketplaceUsers"

    SAMPLE_GOODCOMMENTS = [
        "Very responsive and friendly!",
        "Had some issues with communication, but overall okay.",
        "Highly recommend! Professional and respectful.",
        "Clean and easy to work with.",
        "Great experience, would rent again!",
        "Very accommodating and helpful.",
        "Left the place in excellent condition.",
        "Was noisy at night, but otherwise fine."
    ]

    SAMPLE_BADCOMMENTS = [
        "Would not recommend.",
        "Took a while to respond to messages.",
        "Not clean at all, very messy and hard to live with.",
        "Needs an attitude change.",
        "Not helpful at all, very unfriendly."
    ]

    REVIEWEE_ROLES = ['T', 'L', 'R']

    def handle(self, *args, **kwargs):
        users = list(MarketplaceUser.objects.all())

        if len(users) < 2:
            self.stdout.write(self.style.WARNING("⚠️ Not enough users to generate reviews."))
            return

        total_reviews = 0

        for reviewee in users:
            if random.random() < 0.5:  # 50% chance user gets reviews
                continue

            num_reviews = random.randint(1, min(5, len(users) - 1))
            possible_reviewers = [u for u in users if u.id != reviewee.id]
            reviewers = random.sample(possible_reviewers, num_reviews)

            for reviewer in reviewers:
                # Prevent duplicate review pair
                if Review.objects.filter(reviewer=reviewer, reviewee=reviewee).exists():
                    continue

                rating = random.randint(1, 5)

                # Pick good or bad comment based on rating
                if rating > 3:
                    comment = random.choice(self.SAMPLE_GOODCOMMENTS)
                else:
                    comment = random.choice(self.SAMPLE_BADCOMMENTS)

                Review.objects.create(
                    reviewer=reviewer,
                    reviewee=reviewee,
                    rating=rating,
                    comment=comment,
                    reviewee_role=random.choice(self.REVIEWEE_ROLES)
                )
                total_reviews += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Generated {total_reviews} random reviews without duplicates."))
