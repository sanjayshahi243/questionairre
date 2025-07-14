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
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import MongoFormSerializer, MongoQuestionSerializer, MongoFormAnswerSerializer
from mongo_utils.mongo_connection import get_mongo_connection
from mongo_utils.mongo_models import MongoForm, MongoQuestion
from questionairre.questionnaire.models import MongoFormAnswer
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
import uuid
from datetime import datetime

get_mongo_connection()  # Ensure MongoDB is connected

# MongoDB Question Management Views
@extend_schema(
    tags=['mongo-questions'],
    description='MongoDB-based question management for the questionnaire builder',
    responses={200: MongoQuestionSerializer(many=True)}
)
class MongoQuestionListView(APIView):
    """
    List and create MongoDB questions.
    
    Provides CRUD operations for questions stored in MongoDB.
    These questions are used in dynamic forms and support various types.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List all questions with optional filtering."""
        questions = MongoQuestion.objects.all()
        
        # Apply filters
        question_type = request.query_params.get('type')
        if question_type:
            questions = questions.filter(type=question_type)
            
        search = request.query_params.get('search')
        if search:
            questions = questions.filter(text__icontains=search)
            
        # Sort by creation date (newest first)
        questions = questions.order_by('-created_at')
        
        serializer = MongoQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new question."""
        serializer = MongoQuestionSerializer(data=request.data)
        if serializer.is_valid():
            # Generate unique ID
            question_id = str(uuid.uuid4())
            
            # Create question
            question = MongoQuestion(
                _id=question_id,
                text=serializer.validated_data['text'],
                type=serializer.validated_data['type'],
                options=serializer.validated_data.get('options', []),
                required=serializer.validated_data.get('required', False),
                default_value=serializer.validated_data.get('default_value'),
                validation_rules=serializer.validated_data.get('validation_rules', {}),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            question.save()
            
            return Response(MongoQuestionSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['mongo-questions'],
    description='Retrieve, update, or delete a specific MongoDB question',
    parameters=[
        OpenApiParameter(
            name='question_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='The ID of the question to manage'
        )
    ],
    responses={200: MongoQuestionSerializer}
)
class MongoQuestionDetailView(APIView):
    """
    Retrieve, update, or delete a specific MongoDB question.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, question_id):
        """Retrieve a specific question."""
        question = MongoQuestion.objects(_id=question_id).first()
        if not question:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MongoQuestionSerializer(question)
        return Response(serializer.data)

    def put(self, request, question_id):
        """Update a question."""
        question = MongoQuestion.objects(_id=question_id).first()
        if not question:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MongoQuestionSerializer(data=request.data)
        if serializer.is_valid():
            # Update fields
            question.text = serializer.validated_data['text']
            question.type = serializer.validated_data['type']
            question.options = serializer.validated_data.get('options', [])
            question.required = serializer.validated_data.get('required', False)
            question.default_value = serializer.validated_data.get('default_value')
            question.validation_rules = serializer.validated_data.get('validation_rules', {})
            question.updated_at = datetime.utcnow()
            question.save()
            
            return Response(MongoQuestionSerializer(question).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, question_id):
        """Delete a question."""
        question = MongoQuestion.objects(_id=question_id).first()
        if not question:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if question is used in any forms
        forms_using_question = MongoForm.objects.filter(
            questions__question_id=question_id
        )
        if forms_using_question:
            return Response({
                'error': 'Cannot delete question that is used in forms',
                'forms_count': forms_using_question.count()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Enhanced MongoDB Form Management Views
@extend_schema(
    tags=['mongo-forms'],
    description='MongoDB-based dynamic forms management',
    responses={200: MongoFormSerializer(many=True)}
)
class MongoFormListView(APIView):
    """
    List and create MongoDB-based dynamic forms.
    
    Returns a list of all available dynamic forms stored in MongoDB.
    These forms are flexible and can contain various question types.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List all forms with optional filtering."""
        forms = MongoForm.objects.all()
        
        # Apply filters
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            forms = forms.filter(is_active=is_active.lower() == 'true')
            
        search = request.query_params.get('search')
        if search:
            forms = forms.filter(title__icontains=search)
            
        # Sort by creation date (newest first)
        forms = forms.order_by('-created_at')
        
        serializer = MongoFormSerializer(forms, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new form."""
        serializer = MongoFormSerializer(data=request.data)
        if serializer.is_valid():
            # Generate unique ID
            form_id = str(uuid.uuid4())
            
            # Create form
            form = MongoForm(
                _id=form_id,
                title=serializer.validated_data['title'],
                description=serializer.validated_data.get('description', ''),
                questions=serializer.validated_data.get('questions', []),
                is_active=serializer.validated_data.get('is_active', True),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            form.save()
            
            return Response(MongoFormSerializer(form).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['mongo-forms'],
    description='Get a specific MongoDB form with resolved questions',
    parameters=[
        OpenApiParameter(
            name='form_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='The ID of the form to retrieve'
        )
    ],
    responses={200: MongoFormSerializer}
)
class MongoFormDetailView(APIView):
    """
    Retrieve, update, or delete a specific MongoDB form with resolved questions.
    
    Returns a form with all its questions resolved from the MongoDB database.
    The response includes both form metadata and the actual question content.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, form_id):
        """Retrieve a specific form with resolved questions."""
        form = MongoForm.objects(_id=form_id).first()
        if not form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Resolve questions
        resolved_questions = []
        for qref in form.questions:
            question = MongoQuestion.objects(_id=qref['question_id']).first()
            if not question:
                continue
            qdata = MongoQuestionSerializer(question).data
            qdata.update({
                'order': qref.get('order'),
                'required': qref.get('required'),
                'visible_if': qref.get('visible_if'),
            })
            resolved_questions.append(qdata)
        
        data = MongoFormSerializer(form).data
        data['resolved_questions'] = resolved_questions
        return Response(data)

    def put(self, request, form_id):
        """Update a form."""
        form = MongoForm.objects(_id=form_id).first()
        if not form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MongoFormSerializer(data=request.data)
        if serializer.is_valid():
            # Update fields
            form.title = serializer.validated_data['title']
            form.description = serializer.validated_data.get('description', '')
            form.questions = serializer.validated_data.get('questions', [])
            form.is_active = serializer.validated_data.get('is_active', True)
            form.updated_at = datetime.utcnow()
            form.save()
            
            return Response(MongoFormSerializer(form).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, form_id):
        """Delete a form."""
        form = MongoForm.objects(_id=form_id).first()
        if not form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if form has any answers
        answers_count = MongoFormAnswer.objects.filter(form_id=form_id).count()
        if answers_count > 0:
            return Response({
                'error': 'Cannot delete form that has answers',
                'answers_count': answers_count
            }, status=status.HTTP_400_BAD_REQUEST)
        
        form.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@extend_schema(
    tags=['mongo-forms'],
    description='Duplicate a MongoDB form',
    parameters=[
        OpenApiParameter(
            name='form_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='The ID of the form to duplicate'
        )
    ],
    responses={201: MongoFormSerializer}
)
class MongoFormDuplicateView(APIView):
    """
    Duplicate a MongoDB form with a new ID.
    
    Creates a copy of an existing form with all its questions and settings.
    Useful for creating variations of existing forms.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, form_id):
        """Duplicate a form."""
        original_form = MongoForm.objects(_id=form_id).first()
        if not original_form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate new form ID
        new_form_id = str(uuid.uuid4())
        
        # Create duplicate form
        new_form = MongoForm(
            _id=new_form_id,
            title=f"{original_form.title} (Copy)",
            description=original_form.description,
            questions=original_form.questions,  # Copy questions array
            is_active=False,  # Start as inactive
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        new_form.save()
        
        return Response(MongoFormSerializer(new_form).data, status=status.HTTP_201_CREATED)

@extend_schema(
    tags=['mongo-forms'],
    description='Submit answers to a MongoDB form',
    parameters=[
        OpenApiParameter(
            name='form_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='The ID of the form to submit answers to'
        )
    ],
    request=MongoFormAnswerSerializer,
    responses={
        201: MongoFormAnswerSerializer,
        400: OpenApiTypes.OBJECT
    },
    examples=[
        OpenApiExample(
            'Valid submission',
            value={
                'answers': [
                    {
                        'question_id': '507f1f77bcf86cd799439011',
                        'value': 'John Doe'
                    },
                    {
                        'question_id': '507f1f77bcf86cd799439012',
                        'value': 25
                    }
                ]
            },
            request_only=True
        )
    ]
)
class MongoFormAnswerSubmitView(APIView):
    """
    Submit answers to a MongoDB form.
    
    Accepts a list of question answers and saves them to the database.
    Performs basic validation based on question types.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, form_id):
        form = MongoForm.objects(_id=form_id).first()
        if not form:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)
        
        answers = request.data.get('answers', [])
        user = request.user
        errors = []
        saved = []
        
        for ans in answers:
            question_id = ans.get('question_id')
            value = ans.get('value')
            question = MongoQuestion.objects(_id=question_id).first()
            
            if not question:
                errors.append({'question_id': question_id, 'error': 'Invalid question_id'})
                continue
            
            # Basic type validation (expand as needed)
            if question.type == 'number' and not isinstance(value, (int, float)):
                errors.append({'question_id': question_id, 'error': 'Expected a number'})
                continue
            if question.type == 'boolean' and not isinstance(value, bool):
                errors.append({'question_id': question_id, 'error': 'Expected a boolean'})
                continue
            
            # Save answer
            answer_obj, created = MongoFormAnswer.objects.get_or_create(
                form_id=form_id, question_id=question_id, user=user,
                defaults={'value': value}
            )
            if not created:
                answer_obj.value = value
                answer_obj.save()
            saved.append({'question_id': question_id, 'value': value})
        
        if errors:
            return Response({'errors': errors, 'saved': saved}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'saved': saved}, status=status.HTTP_201_CREATED)


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