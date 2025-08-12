from django.contrib import admin
from django.urls import path, include, re_path
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
    path("delete-profile", views.UserDeleteView.as_view(), name="delete_profile"),
    path("", views.home, name="home"),
    path("favourites", views.FavouritesRetrieveView.as_view(), name="favourites_list"),
    path("favourites/remove/<int:pk>", views.FavouriteDeleteView.as_view(), name="remove_favourite"), # pk = listing id
    path("favourites/add/<int:pk>", views.FavouriteAddView.as_view(), name="add_favourite"), # pk = listing id
    path('conversations/', views.ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation_detail'), # pk = conversation id
    path("conversations/delete/<int:pk>", views.ConversationDeleteView.as_view(), name="conversation_delete"),
    path("conversations/leave/<int:pk>", views.ConversationLeaveView.as_view(), name="conversation_leave"),
    path('listing/<int:pk>/start_conversation', views.StartConversationView.as_view(), name='start_conversation'), # pk = listing id
    path('conversations/<int:pk>/send_message/', views.SendMessageView.as_view(), name='send_message'), # pk = conversation id
    path("messages", views.UnreadMessagesListView.as_view(), name="unread_messages"),
    path("messages/<int:pk>", views.MessageEditView.as_view(), name="edit_messages"),
    path("listings/", views.listings_home, name="listings_home"),
    path("listings/viewAll", views.ListingListView.as_view(), name="viewAllListings"),
    path("listings/add", views.ListingPostingView.as_view(), name="post_listing"),
    path("listings/<int:pk>", views.ListingDetailView.as_view(), name="view_listing"), # pk = listing id
    path("listings/edit/<int:pk>", views.ListingEditView.as_view(), name="edit_listing"), # pk = listing id
    path("listings/delete/<int:pk>", views.ListingDeleteView.as_view(), name="delete_listing"), # pk = listing id
    path("listings/<int:pk>/groups", views.GroupListView.as_view(), name="viewAllGroups"), # pk - listing id
    path("listings/<int:pk>/groups/post", views.GroupPostingView.as_view(), name="post_groups"), # pk - listing id
    path("interaction/send/<int:pk>", views.ListingInteractionCreateView.as_view(), name='interaction_send'), # pk - listing id
    path("recommendations", views.ListingRecommendationList.as_view(), name="listing_recommendations"),
    path("groups/<int:pk>", views.GroupDetailView.as_view(), name="view_group"), # pk - group id
    path("groups/edit/<int:pk>", views.GroupEditView.as_view(), name="edit_group"), # pk - group id
    path("groups/delete/<int:pk>", views.GroupDeleteView.as_view(), name="delete_group"), # pk - group id
    path("groups/manage/<int:pk>", views.GroupManageView.as_view(), name="manage_group"), # pk - group id
    path("groups/<int:pk>/join", views.GroupJoinView.as_view(), name="join_group"), # pk - group id
    path("groups/<int:pk>/leave", views.GroupLeaveView.as_view(), name="leave_group"), # pk - group id,
    path("groups/<int:pk>/invite", views.GroupInvitationCreateView.as_view(), name="invite_group"), # pk - group id
    path("groups/invitations/<int:pk>", views.GroupInvitationRetrieveView.as_view(), name="group-invitation-detail"), # pk - invitation id
    path("groups/invitations", views.GroupInvitationListView.as_view(), name="group-invitation-list"),
    path("groups/invitations/<int:pk>/delete", views.GroupInvitationDeleteView.as_view(), name="group-invitation-delete"), # pk - invitation id
    path("groups/invitations/<int:pk>/update", views.GroupInvitationUpdateView.as_view(), name="group-invitation-update"), # pk - invitation id
    path("applications", views.ApplicationListView.as_view(), name="get_applications"),
    path("applications/management", views.ApplicationManagementListView.as_view(), name="manage_applications"),
    path("profile/reviews", views.ReviewListView.as_view(), name="view_reviews"),
    path("profile/reviews/<int:pk>", views.ReviewPosting.as_view(), name="post_review"), # pk = reviewee id
    path("reviews/<int:pk>", views.ReviewDetailView.as_view(), name="view_review"),# pk = review id
    path("profile/me", views.CurrentUserView.as_view(), name="profile_self"),
    path("reviews/manage/<int:pk>", views.ReviewUpdateDeleteView.as_view(), name="manage_review"), # pk = review id
    path("roommates/", views.RoommateListView.as_view(), name="viewAllRoommates"),
    path("roommates/delete/<int:pk>", views.RoommateDeleteView.as_view(), name="delete_roommate"), # pk = roommare id
    path("roommates/<int:pk>", views.RoommateDetailView.as_view(), name="view_roommate"), # pk = roommate id
    path("roommates/post", views.CreateRoommateView.as_view(), name="post_roommate"),
    path("roommates/edit/<int:pk>", views.RoommateEditView.as_view(), name="edit_roommate"), # pk - roommate id
    path("resend-verification/", views.ResendVerificationEmailView.as_view(), name="resend_verification"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="verify_email"),
    path("password-reset/", views.RequestPasswordResetView.as_view(), name="password_reset"),
    path("password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password_reset_confirm")
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)