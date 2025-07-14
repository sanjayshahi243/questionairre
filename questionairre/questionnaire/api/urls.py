from django.urls import path, include
from rest_framework.routers import DefaultRouter
from questionairre.questionnaire.api.views import (
    QuestionSetViewSet,
    QuestionViewSet,
    QuestionSetQuestionViewSet,
    AnswerViewSet,
    DependencyViewSet
)
from .views import (
    MongoFormListView, 
    MongoFormDetailView, 
    MongoFormAnswerSubmitView,
    MongoFormDuplicateView,
    MongoQuestionListView,
    MongoQuestionDetailView
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
    
    # MongoDB Forms
    path('mongo/forms/', MongoFormListView.as_view(), name='mongo-form-list'),
    path('mongo/forms/<str:form_id>/', MongoFormDetailView.as_view(), name='mongo-form-detail'),
    path('mongo/forms/<str:form_id>/duplicate/', MongoFormDuplicateView.as_view(), name='mongo-form-duplicate'),
    path('mongo/forms/<str:form_id>/submit/', MongoFormAnswerSubmitView.as_view(), name='mongo-form-submit'),
    
    # MongoDB Questions
    path('mongo/questions/', MongoQuestionListView.as_view(), name='mongo-question-list'),
    path('mongo/questions/<str:question_id>/', MongoQuestionDetailView.as_view(), name='mongo-question-detail'),
] 