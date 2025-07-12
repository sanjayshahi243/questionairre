from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from questionairre.users.api.views import UserViewSet

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register("users", UserViewSet)

# Include questionnaire API URLs
from questionairre.questionnaire.api.urls import router as questionnaire_router
router.registry.extend(questionnaire_router.registry)

app_name = "api"
urlpatterns = router.urls
