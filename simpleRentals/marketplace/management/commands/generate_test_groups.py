# myapp/management/commands/generate_conversations.py
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from ...models import (
    MarketplaceUser,
    Listing,
    Conversation,
    Message,
    RoommateUser,
    Group
)


class Command(BaseCommand):
    help = "Generate random test conversations with messages, and create groups for multi-roommate conversations."

    SAMPLE_MESSAGES = [
        "Hi, is this still available?",
        "Yes, it’s available!",
        "Can I schedule a viewing?",
        "Sure, what time works for you?",
        "That works for me.",
        "Is the price negotiable?",
        "When can I move in?",
        "Are utilities included?",
        "Thanks for your time!",
        "I’ll think about it and let you know."
    ]

    def handle(self, *args, **kwargs):
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

        for _ in range(random.randint(5, 10)):  # create 5–10 conversations
            listing = random.choice(listings)
            listing_owner = listing.owner

            # 50% chance: conversation between listing owner and one other user (any user except owner)
            # 50% chance: conversation among roommates only (excluding listing owner)
            if random.random() < 0.5:
                other_user = random.choice([u for u in users if u != listing_owner])
                participants = [listing_owner, other_user]
            else:
                # Multi-roommate conversation, exclude listing owner from participants
                possible_roommates = [u for u in roommate_users if u != listing_owner]
                if len(possible_roommates) < 2:
                    continue  # skip if not enough roommates to form group
                num_roommates = random.randint(2, min(5, len(possible_roommates)))
                participants = random.sample(possible_roommates, num_roommates)

            # Create conversation
            conversation = Conversation.objects.create(listing=listing)
            conversation.participants.set(participants)
            total_convos += 1

            # Each participant sends one message
            for participant in participants:
                msg_content = random.choice(self.SAMPLE_MESSAGES)
                Message.objects.create(
                    conversation=conversation,
                    sender=participant,
                    content=msg_content,
                    timestamp=timezone.now()
                )
                total_messages += 1

            # Create groups only if the conversation is multi-roommate (no listing owner)
            # So, participants count >= 2 and all participants have roommate profiles
            if len(participants) >= 2 and all(p in roommate_users for p in participants):
                member_roommates = [RoommateUser.objects.get(user=p) for p in participants]

                group_name = f"Roomie Group {listing.id}-{total_groups+1}"
                move_in_date = date.today() + timedelta(days=random.randint(10, 90))

                group = Group.objects.create(
                    name=group_name,
                    listing=listing,
                    owner=random.choice(member_roommates),  # Owner is one of the roommates
                    description="Auto-generated group from conversation",
                    move_in_date=move_in_date,
                    move_in_ready=random.choice([True, False]),
                    group_status=random.choice(['O', 'P', 'F', 'S', 'U'])  # exclude 'R' and 'I'
                )
                group.members.set(member_roommates)
                total_groups += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Created {total_convos} conversations with {total_messages} messages and {total_groups} groups."
            )
        )
