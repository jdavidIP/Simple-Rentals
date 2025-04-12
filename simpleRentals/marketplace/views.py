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

from .models import Listing, ListingPicture, Conversation, Message, MarketplaceUser, Review

import os

### USER AUTHENTICATION SECTION - START ###
# API views for user authentication and registration

class CreateUserView(generics.CreateAPIView): # Working (backend only)
    """API view to handle user registration."""
    queryset = MarketplaceUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class LogInView(generics.CreateAPIView): # Working (backend only)
    """API view to handle user login."""
    serializer_class = UserLogInSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)

        # Generate tokens for the user
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response({
            "message": "Login successful",
            "access": str(access),
            "refresh": str(refresh),
        }, status=200)

class UserEditView(generics.UpdateAPIView): # Not Functional yet (needs integration with frontend) - Tested locally and works
    """API view to handle user profile editing."""
    serializer_class = UserEditSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        return self.request.user
    
class UserProfileView(generics.RetrieveAPIView): # Working (backend only)
    """API view to handle user profile retrieval."""
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user = get_object_or_404(MarketplaceUser, id=self.kwargs['pk'])
        return user

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
        
### USER AUTHENTICATION SECTION - END ###

        
### LISTING SECTION - START ###
# API views for listing management
    
class ListingDeleteView(generics.DestroyAPIView): # Not Working yet (needs integration with frontend) - Not tested yet
    """API view to handle listing deletion."""
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

class ListingEditView(generics.UpdateAPIView): # Not Working yet (needs integration with frontend) - Tested locally and works
    """API view to handle listing editing."""
    serializer_class = ListingPostingSerializer
    permission_classes = [IsAuthenticated]  # Ensure only authenticated users can edit listings

    def get_object(self):
        # Get the listing and ensure it belongs to the logged-in user
        listing = get_object_or_404(Listing, id=self.kwargs['pk'], owner=self.request.user)
        return listing
    
class ListingDetailView(generics.RetrieveAPIView): # Working (backend only)
    """API view to handle listing details."""
    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        # Get the listing and ensure it belongs to the logged-in user
        listing = get_object_or_404(Listing, id=self.kwargs['pk'])
        return listing

class ListingPostingView(generics.CreateAPIView): # Not Working yet (needs integration with frontend) - Not tested yet
    """API view to handle listing posting."""
    serializer_class = ListingPostingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # The `context` is already passed to the serializer by DRF
        serializer.save(owner=self.request.user)  # The `owner` is set in the serializer's `create()` method

class ListingListView(generics.ListAPIView):
    """API view to handle listing list based on filters."""
    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        filters = self.request.query_params
        location = filters.get('location')  # City or location filter
        owner = filters.get('owner')  # Owner filter

        # Ensure either location or owner filter is provided
        if not location and not owner:
            raise ValidationError(
                {"Location/Owner": "A location or owner is required to filter listings. Please enter one."}
            )

        # Start with all listings
        queryset = Listing.objects.all()

        # Apply the location filter if provided
        if location:
            queryset = queryset.filter(
                Q(street_address__icontains=location) | Q(city__icontains=location)
            )

        # Apply the owner filter if provided
        if owner:
            queryset = queryset.filter(owner_id=owner)

        # Apply additional filters if they are provided
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
            queryset = queryset.filter(bedrooms__gte=bedrooms)
        if bathrooms:
            queryset = queryset.filter(bathrooms__gte=bathrooms)
        if property_type:
            queryset = queryset.filter(property_type=property_type)

        return queryset
    
### LISTING SECTION - END ###


### CONVERSATION SECTION - START ###
# API views for conversation management

class ConversationListView(generics.ListAPIView): # Not Working yet (needs integration with frontend) - Tested locally and works
    """API view to handle conversation list."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user).order_by('-last_updated')
    
class ConversationDetailView(generics.RetrieveAPIView): # Not Working yet (needs integration with frontend) - Tested locally and works
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

        # Check if conversation already exists
        conversation = Conversation.objects.filter(participants=request.user, listing=listing).first()

        if conversation:
            raise ValidationError("A conversation for this listing already exists.")

        # Create the conversation
        conversation = Conversation.objects.create(listing=listing)
        conversation.participants.add(request.user, listing.owner)

        # Create the initial message
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content="Hello, I'm interested in this listing."
        )

        # Serialize and return the conversation
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SendMessageView(generics.CreateAPIView): # Not Working yet (needs integration with frontend) - Not tested yet
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

### CONVERSATION SECTION - END ###


### REVIEW SECTION - START ###
# API views for Review management

class ReviewListView(generics.ListAPIView):  # Use ListAPIView to return multiple reviews
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


# HOME SECTION - START

# Home page - displays the home page
def home(request):
    return render(request, 'home.html')

# HOME SECTION - END

# Listings home page - displays all listings

def listings_home(request):
    listings = Listing.objects.all()
    return render(request, 'listings/homepage.html', {'listings': listings})