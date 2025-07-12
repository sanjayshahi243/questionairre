from rest_framework import serializers
from questionairre.questionnaire.models import Question, QuestionSet, QuestionSetQuestion, Answer, Dependency


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model."""
    
    class Meta:
        model = Question
        fields = [
            'id', 'text', 'type', 'is_active', 'options', 'visible_if',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Custom validation for question data."""
        # Validate options for appropriate question types
        if data.get('type') in ['select', 'radio', 'checklist']:
            if not data.get('options'):
                raise serializers.ValidationError(
                    "Options are required for select, radio, and checklist questions"
                )
        
        # Validate visible_if structure
        visible_if = data.get('visible_if')
        if visible_if:
            self._validate_visible_if(visible_if)
        
        return data
    
    def _validate_visible_if(self, visible_if):
        """Validate the structure of visible_if conditions."""
        if not isinstance(visible_if, dict):
            raise serializers.ValidationError("visible_if must be a dictionary")
        
        for question_id, condition in visible_if.items():
            if not isinstance(condition, dict):
                raise serializers.ValidationError("Each condition must be a dictionary")
            
            if 'operator' not in condition or 'value' not in condition:
                raise serializers.ValidationError(
                    "Each condition must have 'operator' and 'value' keys"
                )
            
            valid_operators = [
                'equals', 'not_equals', 'contains', 'not_contains',
                'greater_than', 'less_than'
            ]
            if condition['operator'] not in valid_operators:
                raise serializers.ValidationError(
                    f"Invalid operator. Must be one of: {', '.join(valid_operators)}"
                )


class QuestionSetQuestionSerializer(serializers.ModelSerializer):
    """Serializer for QuestionSetQuestion model."""
    question = QuestionSerializer(read_only=True)
    question_id = serializers.UUIDField(write_only=True)
    effective_text = serializers.SerializerMethodField()
    effective_options = serializers.SerializerMethodField()
    effective_visible_if = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionSetQuestion
        fields = [
            'id', 'question_set', 'question', 'question_id', 'order',
            'is_required', 'overrides', 'effective_text', 'effective_options',
            'effective_visible_if', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_effective_text(self, obj):
        """Get the effective question text."""
        return obj.get_effective_text()
    
    def get_effective_options(self, obj):
        """Get the effective options."""
        return obj.get_effective_options()
    
    def get_effective_visible_if(self, obj):
        """Get the effective conditional logic."""
        return obj.get_effective_visible_if()
    
    def validate(self, data):
        """Custom validation for question set question data."""
        # Validate overrides structure
        overrides = data.get('overrides')
        if overrides:
            if not isinstance(overrides, dict):
                raise serializers.ValidationError("overrides must be a dictionary")
            
            valid_override_keys = ['text', 'options', 'visible_if']
            for key in overrides.keys():
                if key not in valid_override_keys:
                    raise serializers.ValidationError(
                        f"Invalid override key. Must be one of: {', '.join(valid_override_keys)}"
                    )
        
        return data


class QuestionSetSerializer(serializers.ModelSerializer):
    """Serializer for QuestionSet model."""
    question_set_questions = QuestionSetQuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionSet
        fields = [
            'id', 'name', 'description', 'version', 'is_active',
            'question_set_questions', 'question_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_question_count(self, obj):
        """Get the number of questions in this question set."""
        return obj.question_set_questions.count()
    
    def validate(self, data):
        """Custom validation for question set data."""
        # Ensure only one active version per question set name
        if data.get('is_active', True):
            existing_active = QuestionSet.objects.filter(
                name=data['name'],
                is_active=True
            )
            if self.instance:
                existing_active = existing_active.exclude(pk=self.instance.pk)
            
            if existing_active.exists():
                raise serializers.ValidationError(
                    "Only one active version allowed per question set name"
                )
        
        return data


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for Answer model."""
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_type = serializers.CharField(source='question.type', read_only=True)
    question_set_name = serializers.CharField(source='question_set.name', read_only=True)
    value = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = [
            'id', 'question_set_question', 'user', 'question_text',
            'question_type', 'question_set_name', 'text_answer', 'number_answer', 
            'boolean_answer', 'json_answer', 'value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_value(self, obj):
        """Get the answer value based on question type."""
        return obj.value
    
    def validate(self, data):
        """Custom validation for answer data."""
        question_set_question = data.get('question_set_question')
        if question_set_question:
            # Ensure answer type matches question type
            question_type = question_set_question.question.type
            
            if question_type in ['text', 'textarea']:
                if not data.get('text_answer'):
                    raise serializers.ValidationError(
                        f"Text answer is required for {question_type} questions"
                    )
            elif question_type == 'number':
                if data.get('number_answer') is None:
                    raise serializers.ValidationError(
                        "Number answer is required for number questions"
                    )
            elif question_type == 'boolean':
                if data.get('boolean_answer') is None:
                    raise serializers.ValidationError(
                        "Boolean answer is required for boolean questions"
                    )
            elif question_type in ['checklist', 'radio', 'select']:
                if not data.get('json_answer'):
                    raise serializers.ValidationError(
                        f"JSON answer is required for {question_type} questions"
                    )
        
        return data


class DependencySerializer(serializers.ModelSerializer):
    """Serializer for Dependency model."""
    dependent_question_text = serializers.CharField(
        source='dependent_question_set_question.question.text', read_only=True
    )
    source_question_text = serializers.CharField(
        source='source_question_set_question.question.text', read_only=True
    )
    
    class Meta:
        model = Dependency
        fields = [
            'id', 'question_set', 'dependent_question_set_question',
            'source_question_set_question', 'condition', 'dependent_question_text',
            'source_question_text', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate(self, data):
        """Custom validation for dependency data."""
        dependent_qsq = data.get('dependent_question_set_question')
        source_qsq = data.get('source_question_set_question')
        
        # Prevent circular dependencies
        if dependent_qsq and source_qsq:
            if dependent_qsq == source_qsq:
                raise serializers.ValidationError(
                    "A question cannot depend on itself"
                )
            
            # Ensure both questions belong to the same question set
            if dependent_qsq.question_set != source_qsq.question_set:
                raise serializers.ValidationError(
                    "Dependent and source questions must belong to the same question set"
                )
        
        # Validate condition structure
        condition = data.get('condition')
        if condition:
            if not isinstance(condition, dict):
                raise serializers.ValidationError("Condition must be a dictionary")
            
            if 'operator' not in condition or 'value' not in condition:
                raise serializers.ValidationError(
                    "Condition must have 'operator' and 'value' keys"
                )
            
            valid_operators = [
                'equals', 'not_equals', 'contains', 'not_contains',
                'greater_than', 'less_than'
            ]
            if condition['operator'] not in valid_operators:
                raise serializers.ValidationError(
                    f"Invalid operator. Must be one of: {', '.join(valid_operators)}"
                )
        
        return data


class QuestionSetDetailSerializer(QuestionSetSerializer):
    """Detailed serializer for QuestionSet with nested questions and dependencies."""
    question_set_questions = QuestionSetQuestionSerializer(many=True, read_only=True)
    dependencies = DependencySerializer(many=True, read_only=True)
    
    class Meta(QuestionSetSerializer.Meta):
        fields = QuestionSetSerializer.Meta.fields + ['dependencies']


class AnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating answers with value field."""
    value = serializers.JSONField(write_only=True)
    
    class Meta:
        model = Answer
        fields = ['question_set_question', 'user', 'value']
    
    def create(self, validated_data):
        """Create answer with proper value assignment."""
        value = validated_data.pop('value')
        answer = Answer.objects.create(**validated_data)
        answer.value = value
        answer.save()
        return answer
    
    def update(self, instance, validated_data):
        """Update answer with proper value assignment."""
        if 'value' in validated_data:
            value = validated_data.pop('value')
            instance.value = value
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance 