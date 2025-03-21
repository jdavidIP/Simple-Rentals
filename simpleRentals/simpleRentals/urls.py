"""
URL configuration for simpleRentals project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from marketplace import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("register/", views.register, name="register"),
    path("profile/", views.profile, name="profile"),
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversation/<int:conversation_id>/', views.conversation_detail, name='conversation_detail'),
    path('listing/<int:listing_id>/start_conversation/', views.start_conversation, name='start_conversation'),
    path('conversation/<int:conversation_id>/send_message/', views.send_message, name='send_message'),
    path("listings/viewAll", views.viewAllListings, name="viewAllListings"),
    path("listings/add", views.addListing, name="addListing")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)