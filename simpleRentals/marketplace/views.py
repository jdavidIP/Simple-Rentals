from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from .models import Conversation, Message, Listing
from django.utils.timezone import now
from .models import Listing

from .forms import UserRegistrationForm
from .forms import MessageForm

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

def viewAllListings(request):
    listings = Listing.objects.all()
    return render(request, 'listings/viewAll.html', {'listings': listings})
