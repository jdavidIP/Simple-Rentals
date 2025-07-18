from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import *
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .serializers import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils.timezone import now
from django.db.models import Q
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from math import radians, cos, sin, asin, sqrt
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .tokens import email_verification_token
from .utils import send_verification_email


from .models import Listing, ListingPicture, Conversation, Message, MarketplaceUser, Review

import os

### USER AUTHENTICATION SECTION - START ###
# API views for user authentication and registration

class CreateUserView(generics.CreateAPIView):
    """API view to handle user registration."""
    queryset = MarketplaceUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class LogInView(generics.CreateAPIView):
    serializer_class = UserLogInSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # BLOCK unverified emails
        if not user.email_verified:
            return Response(
                {"detail": "Email not verified. Please check your inbox or resend the verification email."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        login(request, user)

        # Generate tokens for the user
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response({
            "message": "Login successful",
            "access": str(access),
            "refresh": str(refresh),
        }, status=200)

class UserEditView(generics.UpdateAPIView): 
    """API view to handle user profile editing."""
    serializer_class = UserEditSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class UserProfileView(generics.RetrieveAPIView):
    """API view to handle user profile retrieval."""
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user = get_object_or_404(MarketplaceUser, id=self.kwargs['pk'])
        return user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data

        return Response(data)

class CurrentUserView(generics.RetrieveAPIView):
    """API view to return the currently logged-in user's profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    """Custom logout view to blacklist refresh tokens."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=400)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            print("Token successfully blacklisted.")  # Debugging
            return Response({"message": "Logout successful"}, status=200)
        except Exception as e:
            print("Error blacklisting token:", str(e))  # Debugging
            return Response({"error": "Invalid token"}, status=400)
        

User = get_user_model()

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"detail": "Invalid user."}, status=status.HTTP_400_BAD_REQUEST)
        if user.email_verified:
            return Response({"detail": "Email already verified."}, status=status.HTTP_200_OK)
        if email_verification_token.check_token(user, token):
            user.email_verified = True
            user.save(update_fields=["email_verified"])
            return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account with that email exists, we sent a verification email."}, status=200)
        if user.email_verified:
            return Response({"detail": "Email already verified."}, status=200)
        send_verification_email(user, request)
        return Response({"detail": "Verification email resent. Check your inbox!"}, status=200)
        
### USER AUTHENTICATION SECTION - END ###

        
### LISTING SECTION - START ###
# API views for listing management
    
class ListingDeleteView(generics.DestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Listing.objects.filter(owner=user)

    def perform_destroy(self, instance):
        for picture in instance.pictures.all():
            if picture.image:
                if os.path.isfile(picture.image.path):
                    os.remove(picture.image.path)
        instance.delete()

class ListingEditView(generics.UpdateAPIView):
    """API view to handle listing editing."""
    serializer_class = ListingPostingSerializer
    permission_classes = [IsAuthenticated]  # Ensure only authenticated users can edit listings

    def get_object(self):
        # Get the listing and ensure it belongs to the logged-in user
        listing = get_object_or_404(Listing, id=self.kwargs['pk'], owner=self.request.user)
        return listing
    
class ListingDetailView(generics.RetrieveAPIView):
    """API view to handle listing details."""
    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        # Get the listing and ensure it belongs to the logged-in user
        listing = get_object_or_404(Listing, id=self.kwargs['pk'])
        return listing

class ListingPostingView(generics.CreateAPIView):
    """API view to handle listing posting."""
    serializer_class = ListingPostingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # The `context` is already passed to the serializer by DRF
        serializer.save(owner=self.request.user)  # The `owner` is set in the serializer's `create()` method

class ListingListView(generics.ListAPIView):
    """API view to handle listing list based on filters, including radius search."""
    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two lat/lng points (in km)."""
        R = 6371  # Earth radius in km
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        return R * c

    def get_queryset(self):
        filters = self.request.query_params
        location = filters.get('location')
        owner = filters.get('owner')
        lat = filters.get('lat')
        lng = filters.get('lng')
        radius = float(filters.get('radius', 5))
        
        queryset = Listing.objects.all()

        if not location and not owner and not (lat and lng):
            raise ValidationError(
                {"Location/Owner": "A location, owner, or coordinates are required to filter listings. Please provide at least one."}
            )

        if owner:
            queryset = queryset.filter(owner_id=owner)

        min_price = filters.get('min_price')
        max_price = filters.get('max_price')
        bedrooms = filters.get('bedrooms')
        bathrooms = filters.get('bathrooms')
        property_type = filters.get('property_type')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if bedrooms:
            queryset = queryset.filter(bedrooms=bedrooms)
        if bathrooms:
            queryset = queryset.filter(bathrooms=bathrooms)
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        if lat and lng:
            lat, lng = float(lat), float(lng)
            queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)
            filtered_ids = []
            for listing in queryset:
                distance = self.haversine_distance(lat, lng, listing.latitude, listing.longitude)
                if distance <= radius:
                    filtered_ids.append(listing.id)
            queryset = queryset.filter(id__in=filtered_ids)

        elif location:
            queryset = queryset.filter(
                Q(street_address__icontains=location) | Q(city__icontains=location)
            )

        return queryset
    
### LISTING SECTION - END ###


### CONVERSATION SECTION - START ###
# API views for conversation management

class ConversationListView(generics.ListAPIView):
    """API view to handle conversation list."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user).order_by('-last_updated')
    
class ConversationDetailView(generics.RetrieveAPIView):
    """API view to retrieve conversation details."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Ensure the conversation exists and the user is a participant
        conversation = get_object_or_404(Conversation, id=self.kwargs['pk'], participants=self.request.user)

        if self.request.user not in conversation.participants.all():
            raise PermissionDenied("You do not have permission to view this conversation.")

        # Mark all unread messages as read (except the ones the user sent)
        conversation.messages.filter(read=False).exclude(sender=self.request.user).update(read=True)

        return conversation
    
class StartConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, id=pk)

        # If 'participants' is provided in the request, treat as group conversation
        participant_ids = request.data.get("participants")
        if participant_ids and isinstance(participant_ids, list):
            # Check if a conversation with these participants and this listing already exists
            existing = Conversation.objects.filter(listing=listing)
            for conv in existing:
                conv_participants = set(conv.participants.values_list("id", flat=True))
                if set(participant_ids) == conv_participants:
                    raise ValidationError("A conversation for this group and listing already exists.")

            conversation = Conversation.objects.create(listing=listing)
            users = MarketplaceUser.objects.filter(id__in=participant_ids)
            conversation.participants.add(*users)
            # Optionally, add the sender if not already in the list
            if request.user.id not in participant_ids:
                conversation.participants.add(request.user)

            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content="Hello, group! Let's chat about this listing."
            )
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Otherwise, treat as 1-on-1 conversation between user and landlord
        if listing.owner == request.user:
            raise ValidationError("You cannot start a conversation with yourself.")

        # Check if a 1-on-1 conversation already exists between user and landlord for this listing
        existing = Conversation.objects.filter(listing=listing)
        for conv in existing:
            conv_participants = list(conv.participants.values_list("id", flat=True))
            if (
                len(conv_participants) == 2 and
                request.user.id in conv_participants and
                listing.owner.id in conv_participants
            ):
                raise ValidationError("A conversation for this listing already exists between you and the landlord.")

        conversation = Conversation.objects.create(listing=listing)
        conversation.participants.add(request.user, listing.owner)

        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content="Hello, I'm interested in this listing."
        )

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class ConversationDeleteView(generics.DestroyAPIView):
    serializer_class = GroupSerializer
    permission_clases = [IsAuthenticated]

    def get_object(self):
        conversation = get_object_or_404(Conversation.objects.filter(participants=self.request.user), id=self.kwargs['pk'])

        return conversation
    
    def perform_destroy(self, instance):
        # Only allow deletion if there is exactly one participant and it's the requesting user
        participant_ids = list(instance.participants.values_list("id", flat=True))
        if len(participant_ids) == 1 and participant_ids[0] == self.request.user.id:
            instance.delete()
        else:
            raise PermissionDenied("You can only delete a conversation if you are the only participant.")

class ConversationLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(Conversation, id=pk, participants=request.user)
        conversation.participants.remove(request.user)
        conversation.save()
        return Response({"detail": "You have left the conversation."}, status=status.HTTP_200_OK)

class SendMessageView(generics.CreateAPIView):
    """API view to send a message in a conversation."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        conversation = get_object_or_404(Conversation.objects.filter(participants=self.request.user), id=self.kwargs['pk'])

        # Save the message and associate it with the conversation
        serializer.save(conversation=conversation, sender=self.request.user)

        # Update last_updated field
        conversation.last_updated = now()
        conversation.save(update_fields=['last_updated'])

        # Mark all unread messages as read after sending a message
        conversation.messages.filter(read=False).exclude(sender=self.request.user).update(read=True)

class MessageEditView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        message = get_object_or_404(Message, id=self.kwargs['pk'])
        if message.sender != self.request.user:
            raise PermissionDenied("You do not have permission to edit this message.")
        return message

class UnreadMessagesListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            read=False,
            conversation__participants=user
        ).exclude(sender=user).order_by('-timestamp')

### CONVERSATION SECTION - END ###


### REVIEW SECTION - START ###
# API views for Review management

class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        filters = self.request.query_params
        reviewee = filters.get('reviewee') 
        reviewer = filters.get('reviewer')

        if not reviewer and not reviewee:
            raise ValidationError(
                {"Reviewer/Reviewee": "A reviewer or reviewee is required to filter reviews. Please provide at least one."}
            )

        queryset = Review.objects.all()

        if reviewer:
            queryset = queryset.filter(reviewer=reviewer)

        if reviewee:
            queryset = queryset.filter(reviewee=reviewee)

        return queryset
    
class ReviewDetailView(generics.RetrieveAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        review = get_object_or_404(Review, id=self.kwargs['pk'])

        return review
    
class ReviewPosting(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        reviewee = get_object_or_404(MarketplaceUser, id=self.kwargs['pk'])

        # Check if a conversation already exists
        review = Review.objects.filter(reviewer=self.request.user, reviewee=reviewee).first()

        if review:
            raise ValidationError("You have already posted a review on this user.")
        
        serializer.save(reviewer=self.request.user, reviewee=reviewee)

class IsReviewerOrDenied(permissions.BasePermission):
    """
    Custom permission to only allow reviewers to edit/delete their reviews.
    """
    def has_object_permission(self, request, view, obj):
        return obj.reviewer == request.user


class ReviewUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsReviewerOrDenied]

    def get_object(self):
        review = super().get_object()
        if review.reviewer != self.request.user:
            raise PermissionDenied("You do not have permission to modify this review.")
        return review

### REVIEW SECTION - END ###


### ROOMMATE SECTION - START ###
# API views for roommate management

class RoommateListView(generics.ListAPIView):
    serializer_class = RoommateUserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = RoommateUser.objects.all()
        filters = self.request.query_params

        name = filters.get("name")
        gender_preference = filters.get("gender_preference")
        pet_friendly = filters.get("pet_friendly")
        smoke_friendly = filters.get("smoke_friendly")
        cannabis_friendly = filters.get("cannabis_friendly")
        couple_friendly = filters.get("couple_friendly")
        occupation = filters.get("occupation")
        city = filters.get("city")
        budget_min = filters.get("budget_min")
        budget_max = filters.get("budget_max")

        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.exclude(user=user)

        if name:
            queryset = queryset.filter(
                Q(user__first_name__icontains=name) |
                Q(user__last_name__icontains=name)
            )
        if gender_preference:
            queryset = queryset.filter(gender_preference=gender_preference)
        if pet_friendly is not None:
            queryset = queryset.filter(pet_friendly=pet_friendly.lower() in ["true", "1"])
        if smoke_friendly is not None:
            queryset = queryset.filter(smoke_friendly=smoke_friendly.lower() in ["true", "1"])
        if cannabis_friendly is not None:
            queryset = queryset.filter(cannabis_friendly=cannabis_friendly.lower() in ["true", "1"])
        if couple_friendly is not None:
            queryset = queryset.filter(couple_friendly=couple_friendly.lower() in ["true", "1"])
        if occupation:
            queryset = queryset.filter(occupation=occupation)
        if city:
            queryset = queryset.filter(user__city__icontains=city)
        if budget_min:
            queryset = queryset.filter(roommate_budget__gte=budget_min)
        if budget_max:
            queryset = queryset.filter(roommate_budget__lte=budget_max)

        return queryset
    
class RoommateDetailView(generics.RetrieveAPIView):
    serializer_class = RoommateUserSerializer
    permission_class = [IsAuthenticated]

    def get_object(self):
        roommate = get_object_or_404(RoommateUser, id=self.kwargs['pk'])

        return roommate
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data

        return Response(data)

class CreateRoommateView(generics.CreateAPIView):
    serializer_class = RoommateUserRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # The `context` is already passed to the serializer by DRF
        serializer.save(user=self.request.user)

class RoommateEditView(generics.UpdateAPIView):
    serializer_class = RoommateUserRegistrationSerializer
    permission_class = [IsAuthenticated]

    def get_object(self):
        roommate_user = get_object_or_404(RoommateUser, user=self.request.user)

        return roommate_user
    
### ROOMMATE SECTION - END ###


### GROUP SECTION - START ###
# API views for group management

class GroupListView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        listing = self.kwargs['pk']

        return Group.objects.filter(listing_id=listing)
    
class GroupPostingView(generics.CreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Get the RoommateUser profile for the current user
        roommate_user = get_object_or_404(RoommateUser, user=self.request.user)
        group = serializer.save(owner=roommate_user)
        # Optionally, add the owner as a member of the group
        group.members.add(roommate_user)

class GroupDetailView(generics.RetrieveAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        group = get_object_or_404(Group, id=self.kwargs['pk'])
        return group
    
class GroupJoinView(generics.UpdateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        group = get_object_or_404(Group, id=self.kwargs['pk'])
        roommate_user = get_object_or_404(RoommateUser, user=request.user)

        # Check if user is already a member
        if group.members.filter(id=roommate_user.id).exists():
            return Response({"detail": "You are already a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        # Add user to group
        group.members.add(roommate_user)
        group.save()

        # Find a conversation for this group/listing with all current members as participants
        conversations = Conversation.objects.filter(listing=group.listing)
        for conv in conversations:
            participant_ids = set(conv.participants.values_list("id", flat=True))
            group_member_user_ids = set([m.user.id for m in group.members.all()])
            # If this conversation matches the group members, add the user if not present
            if group_member_user_ids.issubset(participant_ids) or participant_ids.issubset(group_member_user_ids):
                if request.user.id not in participant_ids:
                    conv.participants.add(request.user)

        serializer = self.get_serializer(group)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GroupLeaveView(generics.UpdateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        group = get_object_or_404(Group, id=self.kwargs['pk'])
        roommate_user = get_object_or_404(RoommateUser, user=request.user)

        if not group.members.filter(id=roommate_user.id).exists():
            return Response({"detail": "You are not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        # Remove user from group members
        group.members.remove(roommate_user)
        group.save()
        conversations = Conversation.objects.filter(listing=group.listing)
        for conv in conversations:
            participant_ids = set(conv.participants.values_list("id", flat=True))
            if request.user.id in participant_ids:
                conv.participants.remove(request.user)
        serializer = self.get_serializer(group)
        return Response({"detail": "You have left the group.", "group": serializer.data}, status=status.HTTP_200_OK)
    
class GroupEditView(generics.UpdateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        roommate_user = get_object_or_404(RoommateUser, user=self.request.user)
        group = get_object_or_404(Group, id=self.kwargs['pk'], owner=roommate_user)
        return group

    def update(self, request, *args, **kwargs):
        allowed_statuses = ['O', 'P', 'F', 'S']
        group = self.get_object()
        new_status = request.data.get('group_status')
        if new_status and new_status not in allowed_statuses:
            return Response(
                {"error": "You can only set status to Open, Private, Filled, or Sent."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
class GroupDeleteView(generics.DestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        roommate_user = get_object_or_404(RoommateUser, user=self.request.user)
        group = get_object_or_404(Group, id=self.kwargs['pk'], owner=roommate_user)
        return group
    
    def perform_destroy(self, instance):
        # Find conversations for this listing where all participants are group members
        group_member_user_ids = set(instance.members.values_list("user__id", flat=True))
        conversations = Conversation.objects.filter(listing=instance.listing)
        for conv in conversations:
            participant_ids = set(conv.participants.values_list("id", flat=True))
            # If the conversation participants match the group members, delete it
            if participant_ids == group_member_user_ids:
                conv.delete()
        # Now delete the group itself
        instance.delete()
    
class GroupManageView(generics.UpdateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        group = get_object_or_404(Group, id=self.kwargs['pk'], listing__owner=self.request.user)
        return group

    def update(self, request, *args, **kwargs):
        allowed_statuses = ['U', 'R', 'I']
        group = self.get_object()
        new_status = request.data.get('group_status')
        if new_status and new_status not in allowed_statuses:
            return Response(
                {"error": "You can only set status to Under Review, Rejected, or Invited."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If setting this group to Invited, set all other groups for this listing to Rejected
        if new_status == 'I':
            Group.objects.filter(
                listing=group.listing
            ).exclude(id=group.id).update(group_status='R')
        
        return super().update(request, *args, **kwargs)

class ApplicationListView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Groups with status 'S' where user is the listing owner
        q1 = Q(group_status='S', listing__owner=user)
        # Groups with status 'R' or 'I' where user is a member
        q2 = Q(group_status__in=['R', 'I'], members__user=user)
        return Group.objects.filter(q1 | q2).distinct()
    
class ApplicationManagementListView(generics.ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        user = self.request.user
        # Groups with status S, U, or I where user is the listing owner
        landlord_qs = Group.objects.filter(
            group_status__in=['S', 'U', 'I'],
            listing__owner=user
        ).distinct()
        # All groups where user is a member
        member_qs = Group.objects.filter(
            members__user=user
        ).distinct()

        landlord_data = self.get_serializer(landlord_qs, many=True).data
        member_data = self.get_serializer(member_qs, many=True).data

        return Response({
            "landlord": landlord_data,
            "member": member_data
        })
    

### GROUP INVITATION SECTION - START ###
class GroupInvitationRetrieveView(generics.RetrieveAPIView):
    queryset = GroupInvitation.objects.all()
    serializer_class = GroupInvitationSerializer
    permission_classes = [IsAuthenticated]

class GroupInvitationListView(generics.ListAPIView):
    serializer_class = GroupInvitationSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        roommate_user = RoommateUser.objects.filter(user=request.user).first()
        if not roommate_user:
            return Response({"detail": "No roommate profile found."}, status=404)
        received = GroupInvitation.objects.filter(invited_user=roommate_user)
        sent = GroupInvitation.objects.filter(invited_by=roommate_user)
        data = {
            "received": GroupInvitationSerializer(received, many=True).data,
            "sent": GroupInvitationSerializer(sent, many=True).data,
        }
        return Response(data)

class GroupInvitationCreateView(generics.CreateAPIView):
    queryset = GroupInvitation.objects.all()
    serializer_class = GroupInvitationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        roommate_user = get_object_or_404(RoommateUser, user=self.request.user)
        invited_roommate = get_object_or_404(RoommateUser, id=self.request.data.get("invited_user"))
        group = get_object_or_404(Group, id=self.kwargs['pk'], owner=roommate_user)
        listing = group.listing

        # Check if the invited user is the owner of the listing
        if invited_roommate.user.id == listing.owner.id:
            raise ValidationError("The owner of the listing cannot be invited to the group.")

        serializer.save(invited_by=roommate_user, group=group, invited_user=invited_roommate)

class GroupInvitationUpdateView(generics.UpdateAPIView):
    queryset = GroupInvitation.objects.all()
    serializer_class = GroupInvitationSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        accepted = request.data.get("accepted", None)
        if accepted is not None:
            instance.accepted = accepted
            instance.responded_at = now()
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

class GroupInvitationDeleteView(generics.DestroyAPIView):
    queryset = GroupInvitation.objects.all()
    serializer_class = GroupInvitationSerializer
    permission_classes = [IsAuthenticated]

# HOME SECTION - START

# Home page - displays the home page
def home(request):
    return render(request, 'home.html')

# HOME SECTION - END

# Listings home page - displays all listings

def listings_home(request):
    listings = Listing.objects.all()
    return render(request, 'listings/homepage.html', {'listings': listings})