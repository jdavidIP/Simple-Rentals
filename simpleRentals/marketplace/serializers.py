from django.utils.timezone import now
from rest_framework import serializers
from .models import MarketplaceUser, Listing, ListingPicture, Group, Review, Favorites, Conversation, Message

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
    class Meta:
        model = MarketplaceUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'profile_picture', 'phone_number',
            'facebook_link', 'instagram_link'
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
            'city', 'preferred_location', 'budget_min', 'budget_max', 'profile_picture', 'phone_number',
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
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    password_confirmation = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = MarketplaceUser
        fields = [
            'id', 'email', 'password', 'password_confirmation', 'first_name', 'last_name', 'age', 'sex',
            'city', 'preferred_location', 'budget_min', 'budget_max', 'profile_picture', 'phone_number',
            'facebook_link', 'instagram_link', 'terms_accepted'
        ]

    def validate(self, data):
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')

        if password or password_confirmation:
            if password != password_confirmation:
                raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirmation', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

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

    class Meta:
        model = Listing
        fields = [
            'id', 'price', 'property_type', 'payment_type', 'bedrooms', 'bathrooms', 'sqft_area', 'laundry_type',
            'parking_spaces', 'heating', 'ac', 'extra_amenities', 'pet_friendly', 'move_in_date', 'description',
            'unit_number', 'street_address', 'city', 'postal_code', 'utilities_cost', 'utilities_payable_by_tenant',
            'property_taxes', 'property_taxes_payable_by_tenant', 'condo_fee', 'condo_fee_payable_by_tenant',
            'hoa_fee', 'hoa_fee_payable_by_tenant', 'security_deposit', 'security_deposit_payable_by_tenant',
            'pictures'  # Include pictures in the fields
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
        listing = Listing.objects.create(**validated_data)

        # Save images using your existing logic
        images = self.context['request'].FILES.getlist('pictures')
        front_image = self.context['request'].FILES.get('front_image')
        save_images(listing, images, front_image)

        return listing

    def update(self, instance, validated_data):
        pictures_data = validated_data.pop('pictures', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle deletion of images
        delete_ids = self.context['request'].POST.getlist('delete_images')
        if delete_ids:
            ListingPicture.objects.filter(listing=instance, id__in=delete_ids).delete()

        images = self.context['request'].FILES.getlist('pictures')
        front_image = self.context['request'].FILES.get('front_image')
        save_images(instance, images, front_image)

        return instance

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'listing', 'members', 'description', 
            'move_in_date', 'move_in_ready', 'group_status'
        ]
        extra_kwargs = {
            'name': {'required': True},
            'listing': {'required': True},
            'move_in_date': {'required': True},
            'group_status': {'required': True},
        }


class ReviewSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'reviewee', 'rating', 'comment', 
            'created_at', 'reviewee_role'
        ]
        extra_kwargs = {
            'reviewer': {'read_only': True},
            'reviewee': {'required': True},
            'rating': {'required': True},
            'reviewee_role': {'required': True},
            'created_at': {'read_only': True},
        }


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

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'listing', 'last_updated', 'last_message']
        extra_kwargs = {
            'participants': {'read_only': True},
            'listing': {'required': True},
            'last_updated': {'read_only': True},
        }

    def get_last_message(self, obj):
        # Retrieve the last message in the conversation
        last_message = obj.get_last_message()
        if last_message:
            return MessageSerializer(last_message).data
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)  # Include sender details

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'timestamp', 'read']
        extra_kwargs = {
            'conversation': {'required': True},
            'content': {'required': True},
            'sender': {'read_only': True},
            'timestamp': {'read_only': True},
            'read': {'read_only': True},
        }

    def to_representation(self, instance):
        # Automatically mark messages as read when retrieved
        if not instance.read and instance.sender != self.context['request'].user:
            instance.read = True
            instance.save(update_fields=['read'])
        return super().to_representation(instance)

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)