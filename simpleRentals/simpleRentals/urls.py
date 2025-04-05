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
    path("profile/<int:pk>", views.UserProfileView.as_view(), name="profile"), # pk = user id
    path("logout/", views.logout_view, name="logout"),
    path("login/", views.LogInView.as_view(), name="login"),
    path("edit-profile/", views.UserEditView.as_view(), name="edit_profile"),
    path("", views.home, name="home"),
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversation/<int:pk>/', views.conversation_detail, name='conversation_detail'), # pk = conversation id
    path('listing/<int:pk>/start_conversation/', views.start_conversation, name='start_conversation'), # pk = listing id
    path('conversation/<int:pk>/send_message/', views.send_message, name='send_message'), # pk = conversation id
    path("listings/", views.listings_home, name="listings_home"),
    path("listings/viewAll", views.ListingListView.as_view(), name="viewAllListings"),
    path("listings/add", views.ListingPostingView.as_view(), name="post_listing"),
    path("listings/<int:pk>", views.ListingDetailView.as_view(), name="view_listing"), # pk = listing id
    path("listings/edit/<int:pk>", views.ListingEditView.as_view(), name="edit_listing"), # pk = listing id
    path("listings/delete/<int:pk>", views.ListingDeleteView.as_view(), name="delete_listing"), # pk = listing id
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)