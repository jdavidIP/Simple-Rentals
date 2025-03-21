from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login
from .models import Listing, ListingPicture

from .forms import UserRegistrationForm
from .forms import ListingPostingForm

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

    return render(request, 'registration/register.html', {'form': form})

def profile(request):
    return render(request, 'profile/profile_home.html', {'user': request.user})

def viewAllListings(request):
    listings = Listing.objects.all()
    return render(request, 'listings/viewAll.html', {'listings': listings})

def addListing(request):
    if not request.user.is_authenticated:
        return render(request, 'errors/error.html', {'error': "Access denied. You need to log in to access."})

    if request.method == 'POST':
        form = ListingPostingForm(request.POST, request.FILES)

        if form.is_valid():
            listing = form.save(owner=request.user)

            images = request.FILES.getlist('images')
            if len(images) > 10:
                form.add_error(None, "You can upload a maximum of 10 images.")
                listing.delete()  # Prevent saving incomplete data
                return render(request, 'listings/add.html', {"form": form})

            # Save each image
            for image in images:
                ListingPicture.objects.create(listing=listing, image=image)

            return redirect('viewAllListings')
        else:
            print(form.errors)  # Debugging: Output form errors
    else:
        form = ListingPostingForm()

    return render(request, 'listings/add.html', {"form": form})