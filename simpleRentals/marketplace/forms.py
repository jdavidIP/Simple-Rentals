from django import forms
from .models import MarketplaceUser, Listing, ListingPicture

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    
    class Meta:
        model = MarketplaceUser
        fields = [
            'first_name', 'last_name', 'email', 'password', 'age', 'sex', 'city', 'preferred_location', 
            'budget_min', 'budget_max', 'profile_picture', 'phone_number', 'facebook_link', 
            'instagram_link', 'terms_accepted'
        ]

    # Ensure that the email is not a duplicate
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if MarketplaceUser.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already taken.")
        return email

    # Override the save method to set the username equal to the email
    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.email
        if commit:
            user.set_password(self.cleaned_data['password'])
            user.save()
        return user

class ListingPostingForm(forms.ModelForm):
    move_in_date = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    
    class Meta:
        model = Listing
        fields = [
            'price', 'property_type', 'payment_type', 'bedrooms', 'bathrooms', 'sqft_area', 'laundry_type', 
            'parking_spaces', 'heating', 'ac', 'extra_amenities', 'pet_friendly', 'verification_status', 
            'move_in_date', 'description', 'unit_number', 'street_address', 'city', 'postal_code',
            'utilities_cost', 'utilities_payable_by_tenant', 'property_taxes', 'property_taxes_payable_by_tenant', 
            'condo_fee', 'condo_fee_payable_by_tenant', 'hoa_fee', 'hoa_fee_payable_by_tenant',
            'security_deposit', 'security_deposit_payable_by_tenant'
        ]
    
    def clean_images(self):
        images = self.files.getlist('images')
        if len(images) > 10:
            raise forms.ValidationError("You can upload up to 10 images only.")
        return images

    def save(self, commit=True, owner=None):
        listing = super().save(commit=False)
        if owner:
            listing.owner = owner
        if commit:
            listing.save()
        return listing