from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login
from .models import Listing

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

    form = ListingPostingForm()

    if request.method == 'POST':
        form = ListingPostingForm(request.POST)
        if form.is_valid():
            form.save(owner=request.user)
            return redirect('viewAllListings')

    return render(request, 'listings/add.html', {"form" : form})
