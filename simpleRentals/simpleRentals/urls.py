from django.contrib import admin
from django.urls import path, include
from marketplace import views
from django.conf.urls.static import static
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("register/", views.CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("api-auth/", include("rest_framework.urls")),
    path("profile/<int:pk>", views.UserProfileView.as_view(), name="profile"), # pk = user id
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("login/", views.LogInView.as_view(), name="login"),
    path("edit-profile/", views.UserEditView.as_view(), name="edit_profile"),
    path("", views.home, name="home"),
    path('conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation_detail'), # pk = conversation id
    path('listing/<int:pk>/start_conversation/', views.StartConversationView.as_view(), name='start_conversation'), # pk = listing id
    path('conversations/<int:pk>/send_message/', views.SendMessageView.as_view(), name='send_message'), # pk = conversation id
    path("listings/", views.listings_home, name="listings_home"),
    path("listings/viewAll", views.ListingListView.as_view(), name="viewAllListings"),
    path("listings/add", views.ListingPostingView.as_view(), name="post_listing"),
    path("listings/<int:pk>", views.ListingDetailView.as_view(), name="view_listing"), # pk = listing id
    path("listings/edit/<int:pk>", views.ListingEditView.as_view(), name="edit_listing"), # pk = listing id
    path("listings/delete/<int:pk>", views.ListingDeleteView.as_view(), name="delete_listing"), # pk = listing id
    path("listings/<int:pk>/groups", views.GroupListView.as_view(), name="viewAllGroups"), # pk - listing id
    path("listings/<int:pk>/groups/post", views.GroupPostingView.as_view(), name="viewAllGroups"), # pk - listing id
    path("groups/<int:pk>", views.GroupDetailView.as_view(), name="view_group"),
    path("groups/<int:pk>/join", views.GroupJoinView.as_view(), name="join_group"),
    path("profile/reviews", views.ReviewListView.as_view(), name="view_reviews"),
    path("profile/reviews/<int:pk>", views.ReviewPosting.as_view(), name="post_review"), # pk = reviewee id
    path("profile/me/", views.CurrentUserView.as_view(), name="profile_self"),
    path("reviews/<int:pk>", views.ReviewUpdateDeleteView.as_view(), name="manage_review"), # pk = review id
    path("roommates/", views.RoommateListView.as_view(), name="viewAllRoommates"),
    path("roommates/<int:pk>", views.RoommateDetailView.as_view(), name="view_roommate"), # pk = roommate id
    path("roommates/post", views.CreateRoommateView.as_view(), name="post_roommate")
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)