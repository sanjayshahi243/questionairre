from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

router = DefaultRouter() if settings.DEBUG else SimpleRouter()

# Include users API URLs
from questionairre.users.api.urls import urlpatterns as users_urlpatterns

# Include questionnaire API URLs
from questionairre.questionnaire.api.urls import router as questionnaire_router
router.registry.extend(questionnaire_router.registry)

app_name = "api"
urlpatterns = router.urls + users_urlpatterns
