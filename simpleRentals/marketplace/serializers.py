from django.utils.timezone import now
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import MarketplaceUser, Listing, ListingPicture, Group, Review, Favorites, Conversation, Message, RoommateUser, GroupInvitation
from .utils import send_verification_email
import os

# Utility functions for image validation and saving

def validate_images(serializer, images, front_image, remaining_images_count):
    total_images = remaining_images_count + len(images) + (1 if front_image else 0)

    errors = {}

    if not front_image and remaining_images_count == 0:
        errors['front_image'] = "A front image is required."
    if total_images < 3:
        errors['images'] = "You must have at least 3 images in total."
    if total_images > 10:
        errors['images'] = "You can only upload a maximum of 10 images."

    if errors:
        raise serializers.ValidationError(errors)

    return serializer


def save_images(listing, images, front_image):
    if front_image:
        primary_image = ListingPicture.objects.create(listing=listing, image=front_image, is_primary=True)
        ListingPicture.objects.filter(listing=listing, is_primary=True).exclude(id=primary_image.id).update(is_primary=False)
    for image in images:
        ListingPicture.objects.create(listing=listing, image=image)

# User management serializers

class UserSerializer(serializers.ModelSerializer):
    sex = serializers.CharField(source='get_sex_display')

    class Meta:
        model = MarketplaceUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'age', 'sex',
            'city', 'preferred_location', 'budget_min', 'budget_max', "yearly_income", 'profile_picture', 'phone_number',
            'facebook_link', 'instagram_link', 'receive_email_notifications', 'receive_sms_notifications','terms_accepted',
            'roommate_profile'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirmation = serializers.CharField(write_only=True, style={'input_type': 'password'})
    budget_min = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=0)
    budget_max = serializers.DecimalField(required=True, max_digits=10, decimal_places=2, min_value=0)
    phone_number = serializers.RegexField(
        regex=r'^\+1-\d{3}-\d{3}-\d{4}$',
        required=True,
        max_length=15,
        error_messages={
            'invalid': "Phone number must be in the format +1-XXX-XXX-XXXX."
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'invalid': "Email must be a valid email address."
        }
    )
    terms_accepted = serializers.BooleanField(
        required=True,
        error_messages={
            'required': "You must accept the terms and conditions."
        }
    )
    first_name = serializers.CharField(
        required=True,
        max_length=50,
        error_messages={
            'blank': "First name cannot be blank."
        }
    )
    last_name = serializers.CharField(
        required=True,
        max_length=75,
        error_messages={
            'blank': "Last name cannot be blank."
        }
    )

    class Meta:
        model = MarketplaceUser
        fields = [
            'id', 'email', 'password', 'password_confirmation', 'first_name', 'last_name', 'age', 'sex',
            'city', 'preferred_location', 'budget_min', 'budget_max', "yearly_income", 'profile_picture', 'phone_number',
            'facebook_link', 'instagram_link', 'receive_email_notifications', 'receive_sms_notifications','terms_accepted'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        if MarketplaceUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already taken.")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data


    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms and conditions.")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirmation')  # Remove password_confirmation before creating the user
        validated_data['username'] = validated_data['email']  # Set username to email
        user = MarketplaceUser.objects.create_user(**validated_data)

        request = self.context.get("request")
        send_verification_email(user, request)
        return user
    
class UserLogInSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, error_messages={'blank': "Email cannot be blank."})
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = MarketplaceUser
        fields = ['email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = MarketplaceUser.objects.get(email=email)
        except MarketplaceUser.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        # Add the user object to the validated data
        data['user'] = user
        return data


class UserEditSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    password_confirmation = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    # Accept a boolean for delete_profile_picture
    delete_profile_picture = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = MarketplaceUser
        fields = [
            'id', 'email', 'old_password', 'password', 'password_confirmation', 'first_name', 'last_name', 'age', 'sex',
            'city', 'preferred_location', 'budget_min', 'budget_max', "yearly_income", 'profile_picture', 'phone_number',
            'facebook_link', 'instagram_link', 'terms_accepted', 'delete_profile_picture'
        ]

    def validate(self, data):
        old_password = data.get('old_password')
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')
        user = self.instance

        if password or password_confirmation:
            # Require old password if changing password
            if not old_password:
                raise serializers.ValidationError(
                    {"old_password": "You must provide your current password to set a new one."}
                )

            if not user.check_password(old_password):
                raise serializers.ValidationError(
                    {"old_password": "Old password is incorrect."}
                )

            if password != password_confirmation:
                raise serializers.ValidationError(
                    {"password_confirmation": "Passwords do not match."}
                )
            
        return data

    def update(self, instance, validated_data):
        # Handle profile picture deletion
        delete_picture = validated_data.pop('delete_profile_picture', False)
        new_picture = validated_data.get('profile_picture', None)

        if delete_picture or new_picture:
            # Delete the old profile picture file if it exists
            if instance.profile_picture and hasattr(instance.profile_picture, 'path'):
                import os
                if os.path.isfile(instance.profile_picture.path):
                    os.remove(instance.profile_picture.path)
                instance.profile_picture = None

        password = validated_data.pop('password', None)
        validated_data.pop('password_confirmation', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance
    
class RoommateUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    occupation = serializers.CharField(source='get_occupation_display')
    gender_preference = serializers.CharField(source='get_gender_preference_display')

    class Meta:
        model = RoommateUser
        fields = '__all__'

class RoommateUserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoommateUser
        fields = [
            'id', 'description', 'move_in_date', 'stay_length', 'occupation',
            'roommate_budget', 'smoke_friendly', 'cannabis_friendly', 'pet_friendly',
            'couple_friendly', 'gender_preference', 'open_to_message'
        ]
        extra_kwargs = {
            'description': {'required': True},
            'move_in_date': {'required': True},
            'occupation': {'required': True},
            'gender_preference': {'required': True},
        }

    def create(self, validated_data):
        return RoommateUser.objects.create(**validated_data)

# Listing management serializers

class ListingPictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingPicture
        fields = ['id', 'image', 'location', 'is_primary']
        extra_kwargs = {
            'image': {'required': True},
        }

class ListingSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)  # Include owner details
    pictures = ListingPictureSerializer(many=True)  # Include pictures
    property_type =  serializers.CharField(source='get_property_type_display')
    payment_type = serializers.CharField(source='get_payment_type_display')
    laundry_type = serializers.CharField(source='get_laundry_type_display')
    verification_status =  serializers.CharField(source='get_verification_status_display')

    class Meta:
        model = Listing
        fields = '__all__'

class ListingPostingSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    bedrooms = serializers.IntegerField(min_value=0)
    bathrooms = serializers.IntegerField(min_value=0)
    pictures = ListingPictureSerializer(many=True, read_only=True)
    delete_images = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )

    class Meta:
        model = Listing
        fields = [
            'id', 'price', 'property_type', 'payment_type', 'bedrooms', 'bathrooms', 'sqft_area', 'laundry_type', 'fridge',
            'parking_spaces', 'heating', 'ac', 'extra_amenities', 'pet_friendly', 'move_in_date', 'description',
            'unit_number', 'street_address', 'city', 'postal_code', 'heat', 'hydro', 'water', 'internet', 'furnished'
            'pictures', 'delete_images', 'latitude', 'longitude', 'shareable'
        ]

    def validate(self, data):
        # Validate move-in date
        if data['move_in_date'] < now().date():
            raise serializers.ValidationError({"move_in_date": "Move-in date must be in the future."})

        # Validate images using your existing logic
        images = self.context['request'].FILES.getlist('pictures')
        front_image = self.context['request'].FILES.get('front_image')
        remaining_images_count = self.instance.pictures.count() if self.instance else 0
        validate_images(self, images, front_image, remaining_images_count)

        return data

    def create(self, validated_data):
        # Remove pictures from validated_data
        pictures_data = validated_data.pop('pictures', [])
        validated_data['created_at'] = now()
        listing = Listing.objects.create(**validated_data)

        # Save images using your existing logic
        images = self.context['request'].FILES.getlist('pictures')
        front_image = self.context['request'].FILES.get('front_image')
        save_images(listing, images, front_image)

        return listing
    
    def update(self, instance, validated_data):
        # Delete marked images
        delete_ids = validated_data.pop('delete_images', [])
        if delete_ids:
            images_to_delete = ListingPicture.objects.filter(id__in=delete_ids, listing=instance)
            for image in images_to_delete:
                if image.image and os.path.isfile(image.image.path):
                    os.remove(image.image.path)
                image.delete()

        # Add new pictures
        new_pictures = validated_data.pop('pictures', [])
        # Update other listing fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        images = self.context['request'].FILES.getlist('pictures')
        front_image = self.context['request'].FILES.get('front_image')
        save_images(instance, images, front_image)

        return instance


class GroupSerializer(serializers.ModelSerializer):
    # For reading (GET)
    members = RoommateUserSerializer(many=True, read_only=True)
    # For writing (POST/PUT)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=RoommateUser.objects.all(), write_only=True, source='members'
    )
    owner = RoommateUserSerializer(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'listing', 'members', 'member_ids', 'owner', 'description', 
            'move_in_date', 'move_in_ready', 'group_status'
        ]
        extra_kwargs = {
            'name': {'required': True},
            'listing': {'required': True},
            'move_in_date': {'required': True},
            'group_status': {'required': True},
        }

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        group = Group.objects.create(**validated_data)
        if members:
            group.members.set(members)
        return group
    
class GroupInvitationSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    invited_user = serializers.PrimaryKeyRelatedField(queryset=RoommateUser.objects.all())
    invited_by = serializers.PrimaryKeyRelatedField(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    invited_user_email = serializers.EmailField(source='invited_user.user.email', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.user.email', read_only=True)

    class Meta:
        model = GroupInvitation
        fields = [
            'id', 'group', 'group_name', 'invited_user', 'invited_user_email',
            'invited_by', 'invited_by_email', 'created_at', 'accepted', 'responded_at'
        ]
        read_only_fields = ['created_at', 'responded_at', 'invited_by']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            roommate_user = RoommateUser.objects.get(user=request.user)
            validated_data['invited_by'] = roommate_user
        return super().create(validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    rating = serializers.ChoiceField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    reviewee_role = serializers.ChoiceField(choices=[('T', 'Tenant'), ('L', 'Landlord'), ('R', 'Roommate')])
    reviewee_role_display = serializers.CharField(source='get_reviewee_role_display', read_only=True)
    
    reviewee = serializers.PrimaryKeyRelatedField(queryset=MarketplaceUser.objects.all())
    reviewer = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'reviewee', 'rating', 'comment',
            'created_at', 'reviewee_role', 'reviewee_role_display'
        ]
        extra_kwargs = {
            'reviewee': {'required': True},
            'rating': {'required': True},
            'created_at': {'read_only': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['reviewer'] = UserSerializer(instance.reviewer).data
        data['reviewee'] = UserSerializer(instance.reviewee).data
        return data

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user == data.get('reviewee'):
            raise serializers.ValidationError("You cannot review yourself.")
        return data

class FavoritesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorites
        fields = ['id', 'user', 'favorite_listings']
        extra_kwargs = {
            'user': {'read_only': True},
        }

class ConversationSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)  # Include listing details
    last_message = serializers.SerializerMethodField()  # Add the last message in the conversation
    messages = serializers.SerializerMethodField()  # Add all messages in the conversation
    isGroup = serializers.SerializerMethodField() 

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'listing', 'last_updated', 'last_message', 'messages', 'isGroup']

    def get_last_message(self, obj):
        last_message = obj.get_last_message()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_messages(self, obj):
        messages = obj.messages.order_by('timestamp')  # Order by timestamp ascending
        return MessageSerializer(messages, many=True, context=self.context).data
    
    def get_isGroup(self, obj):
        # A conversation is a group if its participants match any group's members for the same listing
        from .models import Group, RoommateUser
        participant_ids = set(obj.participants.values_list("id", flat=True))
        groups = Group.objects.filter(listing=obj.listing)
        for group in groups:
            group_member_user_ids = set(group.members.values_list("user__id", flat=True))
            if participant_ids == group_member_user_ids and len(participant_ids) > 1:
                return True
        return False

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)  # Include sender details

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'read']
        extra_kwargs = {
            'conversation': {'read_only': True},
            'content': {'required': True},
            'sender': {'read_only': True},
            'timestamp': {'read_only': True},
            'read': {'read_only': True},
        }

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)