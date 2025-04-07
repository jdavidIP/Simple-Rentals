from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import *

from .forms import *
from django.utils.timezone import now
from django.db.models import Q

from .models import Listing, ListingPicture, Conversation, Message

import os

# HOME SECTION - START

# Home page - displays the home page
def home(request):
    return render(request, 'home.html')

# HOME SECTION - END

# USER AUTHENTICTION SECTION - START

# Registration handling - returns a registration form on GET, processes the form on POST
def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST, request.FILES)  # Handle file uploads for profile picture
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('profile')
    else:
        form = UserRegistrationForm()

    return render(request, 'authentication/register.html', {'form': form})

# Logout handling - triggered on "logout" button click and redirects to login page
def logout_view(request):
    logout(request)
    messages.success(request, 'You have logged out successfully.')
    return redirect('login')

# Login handling - returns a login form on GET, processes the form on POST
def login_view(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, 'Login successful!')
            return redirect('profile')
        else:
            messages.error(request, 'Log In Failed. Please Try Again.')
    else:
        return render(request, 'authentication/login.html')

# USER AUTHENTICTION SECTION - END

# PROFILE SECTION - START

# Profile page - displays the user's profile
@login_required(login_url="login")
def profile(request):
    return render(request, 'profile/profile_home.html', {'user': request.user})
  
# Profile edit page - returns a form to edit the user's profile
@login_required(login_url="login")
def edit_profile(request):
    if request.user.is_authenticated:
        form = UserEditForm(request.POST or None, request.FILES or None, instance=request.user)

        if form.is_valid():
            form.save()
            login(request, request.user)
            messages.success(request, ("Your profile updates have been saved successfully"))
            return redirect('profile')

        return render(request, 'profile/edit_profile.html', {'form': form})
    else:
        messages.error(request, "You need to be logged in to view this page")
        return redirect('login')

# PROFILE SECTION - END


@login_required
def conversation_list(request):
    conversations = Conversation.objects.filter(participants=request.user).order_by('-last_updated')
    return render(request, "messaging/conversation_list.html", {"conversations": conversations})

@login_required
def conversation_detail(request, conversation_id):
    conversation = get_object_or_404(Conversation.objects.filter(participants=request.user), id=conversation_id)

    # Mark all unread messages as read (except the ones the user sent)
    conversation.messages.filter(read=False).exclude(sender=request.user).update(read=True)

    form = MessageForm()

    return render(request, 'messaging/conversation_detail.html', {
        'conversation': conversation,
        'form': form
    })

@login_required
def start_conversation(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id)
    
    # Check if a conversation already exists
    conversation = Conversation.objects.filter(participants=request.user, listing=listing).first()
    
    if not conversation:
        conversation = Conversation.objects.create(listing=listing)
        conversation.participants.add(request.user, listing.owner)

        # Create the initial message in the conversation
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content="Hello, I'm interested in this listing."
        )

    return redirect('conversation_detail', conversation_id=conversation.id)

@login_required
def send_message(request, conversation_id):
    conversation = get_object_or_404(Conversation.objects.filter(participants=request.user), id=conversation_id)

    if request.method == "POST":
        form = MessageForm(request.POST)
        if form.is_valid():
            message = form.save(commit=False)
            message.sender = request.user
            message.conversation = conversation
            message.save()

            # Update last_updated field
            conversation.last_updated = now()
            conversation.save(update_fields=['last_updated'])

            # Mark all unread messages as read after sending a message
            conversation.messages.filter(read=False).exclude(sender=request.user).update(read=True)

            return redirect('conversation_detail', conversation_id=conversation.id)

    return redirect('conversation_detail', conversation_id=conversation.id)


# LISTING SECTION - START

# Function to validate images (non end-user facing)
def validate_images(form, images, front_image, remaining_images_count):
    total_images = remaining_images_count + len(images) + (1 if front_image else 0)
    if not front_image and remaining_images_count == 0:
        form.add_error(None, "A front image is required.")
    if total_images < 3:
        form.add_error(None, "You must have at least 3 images in total.")
    if total_images > 10:
        form.add_error(None, "You can only upload a maximum of 10 images.")
    return form

# Function to save images (non end-user facing)
def save_images(listing, images, front_image):
    if front_image:
        primary_image = ListingPicture.objects.create(listing=listing, image=front_image, is_primary=True)
        ListingPicture.objects.filter(listing=listing, is_primary=True).exclude(id=primary_image.id).update(is_primary=False)
    for image in images:
        ListingPicture.objects.create(listing=listing, image=image)

def viewAllListings(request):
    filters = request.GET
    location = filters.get('location')  # City filter

    # Ensure location filter is provided
    if not location:
        return render(request, 'errors/error.html', {'error': "Access denied. You need enter a location to access.", 'back_url': 'listings_home'})

    listings = Listing.objects.all()

    # Get other filter parameters
    min_price = filters.get('min_price')
    max_price = filters.get('max_price')
    bedrooms = filters.get('bedrooms')
    bathrooms = filters.get('bathrooms')
    property_type = filters.get('property_type')

    # Apply filters
    listings = listings.filter(Q(street_address__icontains=location) | Q(city__icontains=location))
    if min_price:
        listings = listings.filter(price__gte=min_price)
    if max_price:
        listings = listings.filter(price__lte=max_price)
    if bedrooms:
        listings = listings.filter(bedrooms__gte=bedrooms)
    if bathrooms:
        listings = listings.filter(bathrooms__gte=bathrooms)
    if property_type:
        listings = listings.filter(property_type=property_type)

    # Add primary image to each listing
    for listing in listings:
        listing.primary_image = listing.pictures.filter(is_primary=True).first()

    return render(request, 'listings/viewAll.html', {'listings': listings, 'filters': filters})

def listings_home(request):
    return render(request, 'listings/homepage.html')

def post_listing(request):
    if not request.user.is_authenticated:
        return render(request, 'errors/error.html', {'error': "Access denied. You need to log in to access.", 'back_url': 'register'})

    if request.method == 'POST':
        form = ListingPostingForm(request.POST, request.FILES)
        if form.is_valid():
            images = request.FILES.getlist('images')
            front_image = request.FILES.get('front_image')
            form = validate_images(form, images, front_image, 0)
            if form.errors:
                return render(request, 'listings/add.html', {"form": form, "is_edit": False})
            listing = form.save(owner=request.user)
            save_images(listing, images, front_image)
            return redirect('listings_home')
    else:
        form = ListingPostingForm()

    return render(request, 'listings/add.html', {"form": form, "is_edit": False})

@login_required
def delete_listing(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id, owner=request.user)
    if request.method == 'POST':
        for picture in listing.pictures.all():
            if picture.image:
                if os.path.isfile(picture.image.path):
                    os.remove(picture.image.path)
        
        listing.delete()
        messages.success(request, 'Listing deleted successfully.')
        return redirect('listings_home')
    return redirect('listings_home')

@login_required
def view_listing(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id)
    return render(request, 'listings/view.html', {'listing': listing})

@login_required
def edit_listing(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id, owner=request.user)
    if request.method == 'POST':
        form = ListingPostingForm(request.POST, request.FILES, instance=listing)
        if form.is_valid():
            delete_images = request.POST.getlist('delete_images')
            images_to_delete = ListingPicture.objects.filter(id__in=delete_images, listing=listing)
            for image in images_to_delete:
                if image.image and os.path.isfile(image.image.path):
                    os.remove(image.image.path)
                image.delete()

            remaining_images_count = listing.pictures.count()
            images = request.FILES.getlist('images')
            front_image = request.FILES.get('front_image')
            form = validate_images(form, images, front_image, remaining_images_count)
            if form.errors:
                return render(request, 'listings/add.html', {"form": form, "is_edit": True, "existing_images": listing.pictures.all()})
            save_images(listing, images, front_image)
            return redirect('listings_home')
    else:
        form = ListingPostingForm(instance=listing)

    existing_images = listing.pictures.all()

    return render(request, 'listings/add.html', {"form": form, "is_edit": True, "existing_images": existing_images})

# LISTING SECTION - END