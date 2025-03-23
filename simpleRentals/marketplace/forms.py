from django import forms

from .models import MarketplaceUser, Listing, ListingPicture, Message


class UserRegistrationForm(forms.ModelForm):
    email = forms.EmailField(label="Your Email:", required=True, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':'example@example.com'}))
    first_name = forms.CharField(label="Your First Name:", required=True, max_length=50, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':'John'}))
    last_name = forms.CharField(label="Your Last Name:", required=True, max_length=75, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':'Smith'}))
    date_of_birth = forms.DateField(
        label="Your Date Of Birth:", 
        required=False, 
        input_formats=["%Y-%m-%d"],  # This will allow input in "YYYY-MM-DD" format
        widget=forms.DateInput(attrs={'class': 'form-control', 'type':'date'}, format='%Y-%m-%d')  # Ensure the widget uses the same format
    )
    sex = forms.TypedChoiceField(label="Your Sex / Gender:", required=False, empty_value="Empty", choices=(('O', "Other"), ('M', "Male"), ('F', "Female")), widget=forms.Select(attrs={'class': 'form-control'}) )
    city = forms.CharField(label="Your Current City", required=False, min_length=1, max_length=50, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':"Toronto, ON"}))
    budget_min = forms.IntegerField(label="The Lowest You Are Looking to Pay:", required=False, widget=forms.TextInput(attrs={'class':'form-control', 'type':'number', 'placeholder':"$500"}))
    budget_max = forms.IntegerField(label="The Maximum You Are Looking to Pay:", required=True, widget=forms.TextInput(attrs={'class':'form-control', 'type':'number', 'placeholder':"$3000"}))
    phone_number = forms.CharField(label="Your Phone Number", required=True, min_length=10, max_length=12, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':"519-915-5115"}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class':'form-control', 'placeholder':"Your Password"}))
    password_confirmation = forms.CharField(widget=forms.PasswordInput(attrs={'class':'form-control', 'placeholder':"Confirm Password"}))
    
    class Meta:
        model = MarketplaceUser
        fields = [
            'first_name', 'last_name', 'email', 'password', 'password_confirmation', 'date_of_birth', 'sex', 'city', 'preferred_location', 
            'budget_min', 'budget_max', 'profile_picture', 'phone_number', 'facebook_link', 
            'instagram_link', 'terms_accepted'
        ]

    # Ensure that the email is not a duplicate
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if MarketplaceUser.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already taken.")
        return email

    def clean_password(self):
        pwd1 = self.cleaned_data.get('password')
        pwd2 = self.cleaned_data.get('password_confirmation')

        if pwd1 != pwd2:
            raise forms.ValidationError("The Passwords Should Match.")
        return pwd1


    # Override the save method to set the username equal to the email
    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.email
        if commit:
            user.set_password(self.cleaned_data.get('password'))
            user.save()
        return user

class UserEditForm(forms.ModelForm):
    email = forms.Field(label="Your Email:", disabled=True, widget=forms.EmailInput(attrs={'class':'form-control'   , 'placeholder':'my_email@examle.com'}))
    first_name = forms.CharField(label="Your First Name:", required=True, max_length=50, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':'John'}))
    last_name = forms.CharField(label="Your Last Name:", required=True, max_length=75, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':'Smith'}))
    date_of_birth = forms.DateField(
        label="Your Date Of Birth:", 
        required=False, 
        input_formats=["%Y-%m-%d"],  # This will allow input in "YYYY-MM-DD" format
        widget=forms.DateInput(attrs={'class': 'form-control', 'type':'date'}, format='%Y-%m-%d')  # Ensure the widget uses the same format
    )
    sex = forms.TypedChoiceField(label="Your Sex / Gender:", required=False, empty_value="Empty", choices=(('O', "Other"), ('M', "Male"), ('F', "Female")), widget=forms.Select(attrs={'class': 'form-control'}) )
    city = forms.CharField(label="Your Current City", required=False, min_length=1, max_length=50, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':"Toronto, ON"}))
    budget_min = forms.IntegerField(label="The Lowest You Are Looking to Pay:", required=False, widget=forms.TextInput(attrs={'class':'form-control', 'type':'number', 'placeholder':"$500"}))
    budget_max = forms.IntegerField(label="The Maximum You Are Looking to Pay:", required=True, widget=forms.TextInput(attrs={'class':'form-control', 'type':'number', 'placeholder':"$3000"}))
    phone_number = forms.CharField(label="Your Phone Number", required=True, min_length=10, max_length=12, widget=forms.TextInput(attrs={'class':'form-control', 'placeholder':"519-915-5115"}))
    password = forms.CharField(required=False, widget=forms.PasswordInput(attrs={'class':'form-control', 'placeholder':"Your Password"}))
    password_confirmation = forms.CharField(required=False, widget=forms.PasswordInput(attrs={'class':'form-control', 'placeholder':"Confirm Password"}))
    
    class Meta:
        model = MarketplaceUser
        fields = [
            'first_name', 'last_name', 'email', 'password', 'password_confirmation', 'date_of_birth', 'sex', 'city', 'preferred_location', 
            'budget_min', 'budget_max', 'profile_picture', 'phone_number', 'facebook_link', 
            'instagram_link', 'terms_accepted'
        ]

    # Ensure that the email is not a duplicate
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not MarketplaceUser.objects.filter(email=email).exists():
            raise forms.ValidationError("You can't change an email. Please do not try to edit this field")
        return email

    def clean_password(self):
        pwd1 = self.cleaned_data.get('password')
        pwd2 = self.cleaned_data.get('password_confirmation')
        user = self.instance  # Access the current user instance

        # If no password is entered, we leave the existing password unchanged
        if not pwd1:
            return None  # Don't change the password

        if pwd1 and pwd2:    
            # If a password is entered, it must match the confirmation password
            if pwd1 != pwd2:
                raise forms.ValidationError("The passwords should match.")
            
            # Check that the entered password is not the same as the existing password
            if user.check_password(pwd1):
                raise forms.ValidationError("The new password cannot be the same as the old password.")

        return pwd1


    # Override the save method to set the username equal to the email
    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.email
        if commit:
            user.set_password(self.cleaned_data.get('password'))
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
    
    def clean(self):
        cleaned_data = super().clean()
        number_fields = [
            'price', 'bedrooms', 'bathrooms', 'sqft_area', 'parking_spaces', 
            'utilities_cost', 'property_taxes', 'condo_fee', 'hoa_fee', 'security_deposit'
        ]
        for field in number_fields:
            value = cleaned_data.get(field)
            if value is not None and value < 0:
                self.add_error(field, "This value cannot be negative.")
        return cleaned_data

    def save(self, commit=True, owner=None):
        listing = super().save(commit=False)
        if owner:
            listing.owner = owner
        if commit:
            listing.save()
        return listing
    
class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write your message...'})
        }
