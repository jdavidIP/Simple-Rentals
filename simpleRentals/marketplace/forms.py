from django import forms
from .models import MarketplaceUser

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