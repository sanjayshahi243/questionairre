from django.urls import path, include
from rest_framework.routers import DefaultRouter
from questionairre.questionnaire.api.views import (
    QuestionSetViewSet,
    QuestionViewSet,
    QuestionSetQuestionViewSet,
    AnswerViewSet,
    DependencyViewSet
)

router = DefaultRouter()
router.register(r'question-sets', QuestionSetViewSet, basename='question-set')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'question-set-questions', QuestionSetQuestionViewSet, basename='question-set-question')
router.register(r'answers', AnswerViewSet, basename='answer')
router.register(r'dependencies', DependencyViewSet, basename='dependency')

app_name = 'questionnaire-api'

urlpatterns = [
    path('', include(router.urls)),
] 