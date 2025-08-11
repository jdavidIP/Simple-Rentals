import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from ...models import MarketplaceUser, Review

ROLE_COMMENTS = {
    "T": {  # Tenant
        "GOOD": [
            "Paid rent on time every month and kept the property in excellent condition throughout the lease. Always respectful and easy to communicate with.",
            "Maintained the apartment in a very clean and tidy state, promptly reported maintenance issues, and respected all house rules without any problems.",
            "An ideal tenant who treated the place like their own home, was courteous to neighbors, and made the handover process smooth and stress-free.",
            "Very responsible tenant who was proactive in communication, respectful of the property, and ensured rent was never late."
        ],
        "MIXED": [
            "Generally a good tenant who communicated well, though there were occasional late rent payments. Overall, the property was kept in decent shape.",
            "Took care of the unit reasonably well, but there were minor cleaning issues that needed addressing at move-out."
        ],
        "BAD": [
            "Frequently late with rent payments and difficult to get in touch with. Left the property in poor condition requiring significant cleaning and repairs.",
            "Did not follow the lease agreement, left trash behind, and ignored repeated requests to address maintenance concerns.",
            "Caused damage to the property and failed to take responsibility, making the rental experience very stressful."
        ]
    },
    "L": {  # Landlord
        "GOOD": [
            "Extremely responsive and professional, quickly addressing any maintenance requests and ensuring the property was always well-maintained.",
            "Made the entire rental process smooth and transparent, from signing the lease to returning the security deposit promptly and fairly.",
            "A fair and understanding landlord who was always available to answer questions and never hesitated to resolve issues quickly.",
            "Showed genuine care for the comfort and safety of the tenants, making this one of the best rental experiences I’ve had."
        ],
        "MIXED": [
            "Generally professional and handled most issues in a timely manner, though there were occasional delays in completing repairs.",
            "Reasonable and approachable, but could improve communication during busy periods when it was harder to get in touch."
        ],
        "BAD": [
            "Rarely responded to messages and left urgent maintenance issues unresolved for extended periods.",
            "Entered the property without providing proper notice and did not follow through on promised repairs.",
            "Very difficult to work with, unprofessional in communication, and unwilling to address reasonable tenant concerns."
        ]
    },
    "R": {  # Roommate
        "GOOD": [
            "Always kept shared spaces clean, was respectful of boundaries, and made the living arrangement enjoyable. Great sense of responsibility in shared bills and chores.",
            "Friendly, considerate, and easy to talk to. Never caused any issues and was a pleasure to share a home with.",
            "Shared responsibilities equally and maintained a positive atmosphere in the household, making it a very comfortable place to live.",
            "Kept noise levels down, respected privacy, and was very reliable when it came to household tasks."
        ],
        "MIXED": [
            "Generally a good roommate who was friendly and cooperative, though occasionally left dishes in the sink a bit too long.",
            "Got along well most of the time, but could be a little noisy during late evenings."
        ],
        "BAD": [
            "Left shared areas messy and often ignored agreements about household chores, making it difficult to maintain a clean environment.",
            "Frequently played loud music late at night and disregarded requests to keep the noise down.",
            "Did not respect personal space or shared responsibilities, creating a tense and uncomfortable living situation."
        ]
    }
}

ROLE_CHOICES = ["T", "L", "R"]  # Tenant, Landlord, Roommate

class Command(BaseCommand):
    help = "Generate random reviews between MarketplaceUsers (no self/duplicate pairs)."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true",
                            help="Delete all reviews before seeding.")
        parser.add_argument("--seed", type=int, default=None,
                            help="Random seed for reproducibility.")
        parser.add_argument("--min-per-user", type=int, default=1,
                            help="Minimum reviews per selected reviewee.")
        parser.add_argument("--max-per-user", type=int, default=3,
                            help="Maximum reviews per selected reviewee.")
        parser.add_argument("--share", type=float, default=0.6,
                            help="Share of users to receive reviews (0..1).")
        parser.add_argument("--days", type=int, default=90,
                            help="Spread timestamps across the past N days (0 = now).")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["seed"] is not None:
            random.seed(opts["seed"])

        do_clear = opts["clear"]
        min_per = max(0, opts["min_per_user"])
        max_per = max(min_per, opts["max_per_user"])
        share   = min(1.0, max(0.0, opts["share"]))
        days    = max(0, opts["days"])

        if do_clear:
            Review.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing reviews."))

        users = list(MarketplaceUser.objects.all())
        if len(users) < 2:
            self.stdout.write(self.style.WARNING("⚠️ Not enough users to generate reviews."))
            return

        # choose who gets reviewed
        num_reviewees = max(1, int(round(len(users) * share)))
        reviewees = random.sample(users, num_reviewees)

        # build a set of existing pairs to avoid duplicates on repeated runs
        existing_pairs = set(Review.objects.values_list("reviewer_id", "reviewee_id"))

        new_reviews = []
        now = timezone.now()

        for reviewee in reviewees:
            # reviewers cannot include self
            possible_reviewers = [u for u in users if u.id != reviewee.id]
            if not possible_reviewers:
                continue

            k = random.randint(min_per, min(max_per, len(possible_reviewers)))
            reviewers = random.sample(possible_reviewers, k)

            for reviewer in reviewers:
                pair = (reviewer.id, reviewee.id)
                if pair in existing_pairs:
                    continue  # skip duplicates
                existing_pairs.add(pair)

                rating = random.choices(
                    population=[5, 4, 3, 2, 1],
                    weights=[30, 30, 20, 12, 8],  # skew a bit positive
                    k=1
                )[0]

                role = random.choice(ROLE_CHOICES)

                if rating >= 5:
                    comment = random.choice(ROLE_COMMENTS[role]["GOOD"])
                elif rating == 4:
                    comment = random.choice(ROLE_COMMENTS[role]["GOOD"] + ROLE_COMMENTS[role]["MIXED"])
                elif rating == 3:
                    comment = random.choice(ROLE_COMMENTS[role]["MIXED"] + ROLE_COMMENTS[role]["BAD"])
                else:
                    comment = random.choice(ROLE_COMMENTS[role]["BAD"])

                if days > 0:
                    minutes_back = random.randint(0, days * 24 * 60)
                    ts = now - timedelta(minutes=minutes_back)
                else:
                    ts = now

                new_reviews.append(Review(
                    reviewer=reviewer,
                    reviewee=reviewee,
                    rating=rating,
                    comment=comment,
                    reviewee_role=role,
                ))

        if not new_reviews:
            self.stdout.write(self.style.WARNING("No new review pairs to create."))
            return

        Review.objects.bulk_create(new_reviews, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(
            f"✅ Generated {len(new_reviews)} reviews without self/duplicate pairs."
        ))
