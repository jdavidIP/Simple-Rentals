from django.utils.timezone import now
from rest_framework import serializers
from .models import MarketplaceUser, Listing, ListingPicture, Group, Review, Favorites, Conversation, Message

# User management serializers

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

class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = '__all__'

class ListingPostingSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    bedrooms = serializers.IntegerField(min_value=0)
    bathrooms = serializers.IntegerField(min_value=0)

    class Meta:
        model = Listing
        fields = [
            'id', 'price', 'property_type', 'payment_type', 'bedrooms', 'bathrooms', 'sqft_area', 'laundry_type',
            'parking_spaces', 'heating', 'ac', 'extra_amenities', 'pet_friendly', 'move_in_date', 'description',
            'unit_number', 'street_address', 'city', 'postal_code', 'utilities_cost', 'utilities_payable_by_tenant',
            'property_taxes', 'property_taxes_payable_by_tenant', 'condo_fee', 'condo_fee_payable_by_tenant',
            'hoa_fee', 'hoa_fee_payable_by_tenant', 'security_deposit', 'security_deposit_payable_by_tenant'
        ]

    def validate(self, data):
        # Shared validation logic for both posting and editing
        if data['move_in_date'] < now().date():
            raise serializers.ValidationError({"move_in_date": "Move-in date must be in the future."})

        return data

    def update(self, instance, validated_data):
        # Update the instance with the validated data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ListingPictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingPicture
        fields = ['id', 'listing', 'image', 'location', 'is_primary']
        extra_kwargs = {
            'listing': {'required': True},
            'image': {'required': True},
        }


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
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'listing', 'last_updated']
        extra_kwargs = {
            'participants': {'read_only': True},
            'listing': {'required': True},
            'last_updated': {'read_only': True},
        }


class MessageSerializer(serializers.ModelSerializer):
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

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)