# myapp/management/commands/generate_conversations.py
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from ...models import (
    MarketplaceUser,
    Listing,
    Conversation,
    Message,
    RoommateUser,
    Group
)

INQUIRY_OPENER = [
    "Hi, is this still available?",
    "Hello! Is the place still on the market?",
    "Hey, just checking if this listing is still available."
]
OWNER_REPLY = [
    "Hi! Yes, it's available. When are you looking to move in?",
    "Yes, it is. Happy to answer any questions you have.",
    "Still available — do you have a preferred move-in date?"
]
VIEWING_OPENER = [
    "Could we schedule a viewing sometime this week?",
    "Is there a time I can come by to see the unit?",
    "I'd like to arrange a viewing if possible."
]
VIEWING_REPLY = [
    "Sure — I have availability on {day} in the {slot}.",
    "Yes, how about {day} {slot}?",
    "That works. {day} {slot} is open for me."
]
NEGOTIATION_OPENER = [
    "Is the price negotiable at all?",
    "Would you consider a slightly lower rent with a longer lease?",
    "Any flexibility on price if I move in earlier?"
]
NEGOTIATION_REPLY = [
    "There's a little flexibility depending on term and references.",
    "Potentially, but it depends on move-in date and credit.",
    "We can discuss after a viewing and application."
]

ROOMMATE_INTROS = [
    "Hey everyone, I’m {first} — budget around ${budget}, looking to move near {date}.",
    "Hi all, {first} here. Prefer {city}, budget about ${budget}, flexible move-in.",
    "Hello! I’m {first}. Budget roughly ${budget}; down to share a {beds}-bed place."
]
ROOMMATE_ACKS = [
    "Nice to meet you — sounds good to me.",
    "Cool, that lines up with what I’m looking for.",
    "Great! I can do that timeline too."
]

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
SLOTS = ["morning", "afternoon", "evening"]

class Command(BaseCommand):
    help = "Generate test conversations/messages and groups from roommate-only convos (one message per user)."

    def add_arguments(self, parser):
        parser.add_argument("--convos", type=int, default=8,
                            help="How many conversations to attempt to create (default 8).")
        parser.add_argument("--clear", action="store_true",
                            help="Delete ALL conversations, messages and groups before seeding.")
        parser.add_argument("--seed", type=int, default=None,
                            help="Random seed for reproducible output.")
        # min/max kept for backward-compatibility but ignored now
        parser.add_argument("--min-msgs", type=int, default=2)
        parser.add_argument("--max-msgs", type=int, default=5)

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["seed"] is not None:
            random.seed(opts["seed"])

        conv_target = max(1, opts["convos"])
        do_clear = opts["clear"]

        if do_clear:
            Message.objects.all().delete()
            Conversation.objects.all().delete()
            Group.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing conversations, messages and groups."))

        users = list(MarketplaceUser.objects.all())
        roommate_users = list(MarketplaceUser.objects.filter(roommate_profile__isnull=False))
        listings = list(Listing.objects.select_related("owner").all())

        if not listings:
            self.stdout.write(self.style.WARNING("⚠️ No listings found. Cannot create conversations."))
            return
        if len(users) < 2:
            self.stdout.write(self.style.WARNING("⚠️ Not enough users to create conversations."))
            return

        total_convos = 0
        total_messages = 0
        total_groups = 0

        def convo_exists(listing, participants):
            p_ids = sorted([p.id for p in participants])
            for c in Conversation.objects.filter(listing=listing):
                c_ids = sorted([u.id for u in c.participants.all()])
                if c_ids == p_ids:
                    return True
            return False

        attempts = 0
        max_attempts = conv_target * 4

        while total_convos < conv_target and attempts < max_attempts:
            attempts += 1
            listing = random.choice(listings)
            listing_owner = listing.owner

            # 50% owner<->one other, 50% roommate-only (exclude owner)
            if random.random() < 0.5:
                # two-person, owner + one other
                other = random.choice([u for u in users if u.id != listing_owner.id])
                participants = [listing_owner, other]
                with_owner = True
            else:
                possible = [u for u in roommate_users if u.id != listing_owner.id]
                if len(possible) < 2:
                    continue
                num = random.randint(2, min(5, len(possible)))
                participants = random.sample(possible, num)
                with_owner = False

            if convo_exists(listing, participants):
                continue

            convo = Conversation.objects.create(listing=listing)
            convo.participants.set(participants)
            total_convos += 1

            # ---- ONE MESSAGE PER USER, coherent content ----
            msgs = []
            base_ts = timezone.now() - timedelta(minutes=len(participants))
            if with_owner:
                # two messages, one per user, coherent pair
                renter = participants[1]  # not owner
                owner = participants[0]

                scenario = random.choice(["inquiry", "viewing", "negotiation"])
                if scenario == "inquiry":
                    m1 = random.choice(INQUIRY_OPENER)
                    m2 = random.choice(OWNER_REPLY)
                elif scenario == "viewing":
                    m1 = random.choice(VIEWING_OPENER)
                    m2 = random.choice(VIEWING_REPLY).format(day=random.choice(DAYS), slot=random.choice(SLOTS))
                else:
                    m1 = random.choice(NEGOTIATION_OPENER)
                    m2 = random.choice(NEGOTIATION_REPLY)

                msgs.append(Message(
                    conversation=convo,
                    sender=renter,
                    content=f"{m1}",
                    timestamp=base_ts + timedelta(minutes=1),
                ))
                # Add a tiny bit of listing context
                title = f"{listing.bedrooms}-bed" if getattr(listing, 'bedrooms', None) else "the unit"
                addr = getattr(listing, "street_address", "") or ""
                msgs.append(Message(
                    conversation=convo,
                    sender=owner,
                    content=f"{m2} ({title} at {addr})".strip(),
                    timestamp=base_ts + timedelta(minutes=2),
                ))

            else:
                # roommate-only: each participant posts exactly once (intro/ack)
                beds = getattr(listing, "bedrooms", 2) or 2
                for i, user in enumerate(participants, start=1):
                    first = user.first_name or "User"
                    city  = getattr(user, "preferred_location", "") or (getattr(listing, "city", "") or "the area")
                    # Make budgets clean-looking if present
                    budget = getattr(user, "budget_max", None) or getattr(user, "budget_min", None) or 1200
                    # Round to the nearest 50 for nice output
                    budget = int(round(float(budget) / 50) * 50)

                    if i == 1:
                        # Initiator: propose forming a group or timing
                        line = random.choice(ROOMMATE_INTROS).format(
                            first=first, budget=budget, date=(timezone.now().date() + timedelta(days=random.randint(10, 45))).isoformat(),
                            city=city, beds=beds
                        )
                    else:
                        line = random.choice(ROOMMATE_ACKS)

                    msgs.append(Message(
                        conversation=convo,
                        sender=user,
                        content=line,
                        timestamp=base_ts + timedelta(minutes=i),
                    ))

                # Create a Group only for roommate-only conversations
                member_roommates = []
                ok = True
                for p in participants:
                    try:
                        member_roommates.append(RoommateUser.objects.get(user=p))
                    except RoommateUser.DoesNotExist:
                        ok = False
                        break
                if ok and member_roommates:
                    group = Group.objects.create(
                        name=f"Roomie Group {listing.id}-{total_groups+1}",
                        listing=listing,
                        owner=random.choice(member_roommates),
                        description="Auto-generated group from conversation",
                        move_in_date=(timezone.now().date() + timedelta(days=random.randint(10, 90))),
                        move_in_ready=bool(random.getrandbits(1)),
                        group_status=random.choice(['O', 'P', 'F', 'S', 'U'])
                    )
                    group.members.set(member_roommates)
                    total_groups += 1

            Message.objects.bulk_create(msgs)
            total_messages += len(msgs)

        self.stdout.write(self.style.SUCCESS(
            f"✅ Created {total_convos} conversations with {total_messages} messages and {total_groups} groups."
        ))
