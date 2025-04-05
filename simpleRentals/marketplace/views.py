from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import *
from rest_framework import generics
from rest_framework.response import Response
from .serializers import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from .forms import *
from django.utils.timezone import now
from django.db.models import Q
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Listing, ListingPicture, Conversation, Message, MarketplaceUser

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
        return Response({"message": "Login successful"}, status=200)

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

class LogoutView(APIView): # Not Working yet (needs integration with frontend) - Not tested yet
    """Custom logout view to blacklist refresh tokens."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=200)
        except Exception as e:
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

class ListingEditView(generics.RetrieveUpdateAPIView): # Not Working yet (needs integration with frontend) - Tested locally and works
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

class ListingListView(generics.ListAPIView): # Working (backend only)
    """API view to handle listing list based on filters."""
    serializer_class = ListingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        filters = self.request.query_params
        location = filters.get('location')  # City filter

        # Ensure location filter is provided
        if not location:
            return Listing.objects.none()  # Return an empty queryset if no location is provided

        queryset = Listing.objects.all()

        # Apply filters (add more filters as needed)
        queryset = queryset.filter(Q(street_address__icontains=location) | Q(city__icontains=location))
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
    
class StartConversationView(generics.CreateAPIView): # Not Working yet (needs integration with frontend) - Not tested yet
    """API view to start a conversation for a listing."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        listing = get_object_or_404(Listing, id=self.kwargs['pk'])

        # Check if a conversation already exists
        conversation = Conversation.objects.filter(participants=self.request.user, listing=listing).first()

        if conversation:
            raise serializer.ValidationError("A conversation for this listing already exists.")

        # Create the conversation and add participants
        conversation = serializer.save(listing=listing)
        conversation.participants.add(self.request.user, listing.owner)

        # Create the initial message in the conversation
        Message.objects.create(
            conversation=conversation,
            sender=self.request.user,
            content="Hello, I'm interested in this listing."
        )

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


# HOME SECTION - START

# Home page - displays the home page
def home(request):
    return render(request, 'home.html')

# HOME SECTION - END

# Listings home page - displays all listings

def listings_home(request):
    listings = Listing.objects.all()
    return render(request, 'listings/homepage.html', {'listings': listings})