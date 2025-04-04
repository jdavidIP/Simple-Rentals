from django.contrib import admin
from django.urls import path, include
from marketplace import views
from django.conf.urls.static import static
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("register/", views.CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path("profile/", views.profile, name="profile"),
    path("logout/", views.logout_view, name="logout"),
    path("login/", views.LogInView.as_view(), name="login"),
    path("edit-profile/", views.edit_profile, name="edit_profile"),
    path("", views.home, name="home"),
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversation/<int:conversation_id>/', views.conversation_detail, name='conversation_detail'),
    path('listing/<int:listing_id>/start_conversation/', views.start_conversation, name='start_conversation'),
    path('conversation/<int:conversation_id>/send_message/', views.send_message, name='send_message'),
    path("listings/", views.listings_home, name="listings_home"),
    path("listings/viewAll", views.ListingAllView.as_view(), name="viewAllListings"),
    path("listings/add", views.post_listing, name="post_listing"),
    path("listings/<int:listing_id>", views.view_listing, name="view_listing"),
    path("listings/edit/<int:listing_id>", views.edit_listing, name="edit_listing"),
    path("listings/delete/<int:listing_id>", views.ListingDeleteView.as_view(), name="delete_listing"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)