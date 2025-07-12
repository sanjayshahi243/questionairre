from django.urls import path, include
from rest_framework.routers import DefaultRouter
from questionairre.users.api.views import UserViewSet, EmailAuthTokenView, UserRegistrationView

router = DefaultRouter()
router.register("users", UserViewSet)

app_name = "api"
urlpatterns = [
    path("", include(router.urls)),
    path("auth-token/", EmailAuthTokenView.as_view(), name="auth-token"),
    path("users/register/", UserRegistrationView.as_view(), name="user-register"),
] 