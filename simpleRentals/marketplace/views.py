from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import *

from .forms import *

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

@login_required(login_url="login")
def profile(request):
    return render(request, 'profile/profile_home.html', {'user': request.user})

# PROFILE SECTION - END