from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection

APP_TABLES = [
    # m2m/link tables first
    "marketplace_favorites_favorite_listings",
    "marketplace_conversation_participants",
    "marketplace_group_members",
    "marketplace_marketplaceuser_groups",
    "marketplace_marketplaceuser_user_permissions",
    # children
    "marketplace_message",
    "marketplace_listingpicture",
    "marketplace_listinginteraction",
    "marketplace_review",
    "marketplace_groupinvitation",
    # parents
    "marketplace_group",
    "marketplace_conversation",
    "marketplace_favorites",
    "marketplace_roommateuser",
    "marketplace_listing",
    "marketplace_marketplaceuser",
]

TOKEN_TABLES = [
    "token_blacklist_blacklistedtoken",
    "token_blacklist_outstandingtoken",  
]

class Command(BaseCommand):
    help = "Clear marketplace data and repopulate users, listings, conversations, reviews, interactions."

    def add_arguments(self, parser):
        # clearing
        parser.add_argument("--no-clear", action="store_true",
                            help="Skip truncating app tables before populating.")
        parser.add_argument("--clear-tokens", action="store_true",
                            help="Also truncate token blacklist tables (JWT).")

        # seed_users passthrough
        parser.add_argument("--users", type=int, default=20,
                            help="Number of users to create (default 20).")
        parser.add_argument("--print-creds", action="store_true",
                            help="Print generated user credentials to stdout.")
        parser.add_argument("--no-avatars", action="store_true",
                            help="Skip downloading avatars for users.")

        # conversations passthrough
        parser.add_argument("--convos", type=int, default=8,
                            help="How many conversations to attempt (default 8).")
        parser.add_argument("--min-msgs", type=int, default=2)
        parser.add_argument("--max-msgs", type=int, default=5)
        parser.add_argument("--seed", type=int, default=None,
                            help="Random seed for reproducibility.")

        # interactions passthrough
        parser.add_argument("--clicks", type=int, default=5,
                            help="Max clicks per roommate user (default 5).")
        parser.add_argument("--favs", type=int, default=2,
                            help="Max favourites per roommate user (default 2).")
        parser.add_argument("--exclude-owned", action="store_true",
                            help="Avoid interacting with own listings.")
        parser.add_argument("--interactions-days", type=int, default=60,
                            help="Spread interaction timestamps across past N days.")

        # reviews passthrough
        parser.add_argument("--review-share", type=float, default=0.6,
                            help="Fraction of users who receive reviews (0..1).")
        parser.add_argument("--review-min", type=int, default=1)
        parser.add_argument("--review-max", type=int, default=3)
        parser.add_argument("--review-days", type=int, default=90)

    def handle(self, *args, **opts):
        self.stdout.write(self.style.MIGRATE_HEADING("🚀 Populating database"))

        if not opts["no_clear"]:
            self.stdout.write(self.style.WARNING("⚠️ Truncating marketplace tables…"))
            self._truncate_tables(APP_TABLES)
            if opts["clear_tokens"]:
                self._truncate_tables(TOKEN_TABLES, ignore_missing=True)
            self.stdout.write(self.style.SUCCESS("✅ Tables truncated."))

        # 1) Users
        self.stdout.write(self.style.HTTP_INFO("👤 Seeding users…"))
        call_command(
            "generate_test_users",
            count=opts["users"],
            clear=False,             
            no_avatars=opts["no_avatars"],
            print_creds=opts["print_creds"],
        )

        # 2) Listings (guarantees lat/lng)
        self.stdout.write(self.style.HTTP_INFO("🏠 Seeding listings…"))
        call_command("generate_test_listings")

        # 3) Conversations & Groups
        self.stdout.write(self.style.HTTP_INFO("💬 Seeding conversations & groups…"))
        convo_kwargs = {
            "convos": opts["convos"],
            "min_msgs": opts["min_msgs"],
            "max_msgs": opts["max_msgs"],
        }
        if opts["seed"] is not None:
            convo_kwargs["seed"] = opts["seed"]
        call_command("generate_test_groups", **convo_kwargs)

        # 4) Reviews
        self.stdout.write(self.style.HTTP_INFO("⭐ Seeding reviews…"))
        review_kwargs = {
            "share": opts["review_share"],
            "min_per_user": opts["review_min"],
            "max_per_user": opts["review_max"],
            "days": opts["review_days"],
        }
        if opts["seed"] is not None:
            review_kwargs["seed"] = opts["seed"]
        call_command("generate_test_reviews", **review_kwargs)

        # 5) Interactions
        self.stdout.write(self.style.HTTP_INFO("🖱️ Seeding interactions…"))
        inter_kwargs = {
            "clicks": opts["clicks"],
            "favs": opts["favs"],
            "days": opts["interactions_days"],
        }
        if opts["exclude_owned"]:
            inter_kwargs["exclude_owned"] = True
        if opts["seed"] is not None:
            inter_kwargs["seed"] = opts["seed"]
        call_command("generate_test_interactions", **inter_kwargs)

        self.stdout.write(self.style.SUCCESS("✅ populate_all completed."))

    def _truncate_tables(self, names, ignore_missing=False):
        """TRUNCATE … RESTART IDENTITY CASCADE the given tables if they exist."""
        existing = set(connection.introspection.table_names())
        to_truncate = [n for n in names if (n in existing or not ignore_missing)]
        if not to_truncate:
            return
        with connection.cursor() as cur:
            # Quote identifiers safely
            q = ", ".join(f'"{n}"' for n in to_truncate if n in existing)
            if not q:
                return
            cur.execute(f"TRUNCATE TABLE {q} RESTART IDENTITY CASCADE;")
