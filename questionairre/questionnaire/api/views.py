from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from questionairre.questionnaire.models import Question, QuestionSet, QuestionSetQuestion, Answer, Dependency
from questionairre.questionnaire.api.serializers import (
    QuestionSerializer,
    QuestionSetSerializer,
    QuestionSetDetailSerializer,
    QuestionSetQuestionSerializer,
    AnswerSerializer,
    AnswerCreateSerializer,
    DependencySerializer
)


class QuestionSetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for QuestionSet model.
    
    Provides CRUD operations for question sets with versioning support.
    Question sets can contain multiple questions and support versioning for data integrity.
    """
    queryset = QuestionSet.objects.all()
    serializer_class = QuestionSetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'version']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'version', 'created_at', 'updated_at']
    ordering = ['name', '-version']
    
    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'retrieve':
            return QuestionSetDetailSerializer
        return QuestionSetSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplicate a question set with a new version.
        
        Creates a new version of the question set with all its questions and dependencies.
        The new version starts as inactive and can be activated later.
        """
        question_set = self.get_object()
        
        # Create new version
        new_version = QuestionSet.objects.create(
            name=question_set.name,
            description=question_set.description,
            version=question_set.version + 1,
            is_active=False  # New version starts as inactive
        )
        
        # Duplicate all question set questions
        for qsq in question_set.question_set_questions.all():
            QuestionSetQuestion.objects.create(
                question_set=new_version,
                question=qsq.question,
                order=qsq.order,
                is_required=qsq.is_required,
                overrides=qsq.overrides
            )
        
        # Duplicate dependencies
        for dependency in question_set.dependencies.all():
            # Get the corresponding question set questions in the new version
            old_dependent_qsq = dependency.dependent_question_set_question
            old_source_qsq = dependency.source_question_set_question
            
            new_dependent_qsq = QuestionSetQuestion.objects.get(
                question_set=new_version,
                question=old_dependent_qsq.question,
                order=old_dependent_qsq.order
            )
            new_source_qsq = QuestionSetQuestion.objects.get(
                question_set=new_version,
                question=old_source_qsq.question,
                order=old_source_qsq.order
            )
            
            Dependency.objects.create(
                question_set=new_version,
                dependent_question_set_question=new_dependent_qsq,
                source_question_set_question=new_source_qsq,
                condition=dependency.condition
            )
        
        serializer = self.get_serializer(new_version)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a question set version.
        
        Makes this question set version active and deactivates other versions of the same name.
        Only one version of a question set can be active at a time.
        """
        question_set = self.get_object()
        question_set.is_active = True
        question_set.save()
        
        serializer = self.get_serializer(question_set)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for a question set."""
        question_set = self.get_object()
        question_set_questions = question_set.question_set_questions.filter(
            question__is_active=True
        ).order_by('order')
        serializer = QuestionSetQuestionSerializer(question_set_questions, many=True)
        return Response(serializer.data)


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Question model.
    
    Provides CRUD operations for reusable questions.
    Questions can be used across multiple question sets and support various types and conditional logic.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['text']
    ordering_fields = ['text', 'created_at', 'updated_at']
    ordering = ['text']
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def answers(self, request, pk=None):
        """Get all answers for a specific question."""
        question = self.get_object()
        # Get answers through question set questions
        answers = Answer.objects.filter(question_set_question__question=question)
        serializer = AnswerSerializer(answers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def question_sets(self, request, pk=None):
        """Get all question sets that contain this question."""
        question = self.get_object()
        question_sets = question.question_sets.all()
        serializer = QuestionSetSerializer(question_sets, many=True)
        return Response(serializer.data)


class QuestionSetQuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for QuestionSetQuestion model.
    
    Manages the relationship between questions and question sets.
    Allows for per-set customization of questions including order, requirements, and overrides.
    """
    queryset = QuestionSetQuestion.objects.all()
    serializer_class = QuestionSetQuestionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['question_set', 'question', 'is_required']
    ordering_fields = ['order', 'created_at', 'updated_at']
    ordering = ['order']
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def bulk_update_order(self, request):
        """
        Update the order of multiple questions in a question set.
        
        Accepts a list of question set question IDs with their new order values.
        Useful for reordering questions within a question set.
        """
        data = request.data
        if not isinstance(data, list):
            return Response(
                {"error": "Data must be a list of question set question IDs with order"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for item in data:
            qsq_id = item.get('id')
            order = item.get('order')
            if qsq_id and order is not None:
                try:
                    qsq = QuestionSetQuestion.objects.get(id=qsq_id)
                    qsq.order = order
                    qsq.save()
                except QuestionSetQuestion.DoesNotExist:
                    return Response(
                        {"error": f"QuestionSetQuestion with id {qsq_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        return Response({"message": "Order updated successfully"})


class AnswerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Answer model.
    
    Manages user answers to questions within specific question sets.
    Supports various answer types based on question type and provides bulk operations.
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['question_set_question', 'user']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action in ['create', 'update', 'partial_update']:
            return AnswerCreateSerializer
        return AnswerSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        
        # Regular users can only see their own answers
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the user automatically when creating an answer."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_answers(self, request):
        """Get current user's answers."""
        answers = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(answers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple answers at once.
        
        Accepts a list of answer objects and creates them in a single request.
        Useful for submitting entire questionnaires at once.
        """
        answers_data = request.data
        if not isinstance(answers_data, list):
            return Response(
                {"error": "Data must be a list of answers"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_answers = []
        for answer_data in answers_data:
            answer_data['user'] = request.user.id
            serializer = AnswerCreateSerializer(data=answer_data)
            if serializer.is_valid():
                answer = serializer.save(user=request.user)
                created_answers.append(answer)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        response_serializer = AnswerSerializer(created_answers, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class DependencyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Dependency model.
    
    Manages conditional logic between questions within question sets.
    Defines when questions should be visible based on other question answers.
    """
    queryset = Dependency.objects.all()
    serializer_class = DependencySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['question_set', 'dependent_question_set_question', 'source_question_set_question']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    @action(detail=False, methods=['get'])
    def for_question_set(self, request):
        """Get all dependencies for a specific question set."""
        question_set_id = request.query_params.get('question_set')
        if not question_set_id:
            return Response(
                {"error": "question_set parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dependencies = self.get_queryset().filter(question_set_id=question_set_id)
        serializer = self.get_serializer(dependencies, many=True)
        return Response(serializer.data) 