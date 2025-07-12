import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class QuestionSet(models.Model):
    """
    A collection of questions that can be versioned.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text=_("Name of the question set"))
    description = models.TextField(blank=True, help_text=_("Description of the question set"))
    version = models.PositiveIntegerField(default=1, help_text=_("Version number of this question set"))
    is_active = models.BooleanField(default=True, help_text=_("Whether this version is active"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Many-to-many relationship with Question through QuestionSetQuestion
    questions = models.ManyToManyField(
        'Question',
        through='QuestionSetQuestion',
        related_name='question_sets',
        help_text=_("Questions in this question set")
    )
    
    class Meta:
        unique_together = ['name', 'version']
        ordering = ['name', '-version']
        verbose_name = _("Question Set")
        verbose_name_plural = _("Question Sets")
    
    def __str__(self):
        return f"{self.name} v{self.version}"
    
    def clean(self):
        # Ensure only one active version per question set name
        if self.is_active:
            QuestionSet.objects.filter(
                name=self.name,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)


class Question(models.Model):
    """
    Individual question with various types and conditional logic support.
    Questions are now reusable across multiple question sets.
    """
    QUESTION_TYPES = [
        ('text', _('Text')),
        ('textarea', _('Text Area')),
        ('number', _('Number')),
        ('boolean', _('Yes/No')),
        ('checklist', _('Checklist')),
        ('radio', _('Radio')),
        ('select', _('Select')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    text = models.TextField(help_text=_("Question text"))
    type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default='text',
        help_text=_("Type of question")
    )
    is_active = models.BooleanField(default=True, help_text=_("Whether this question is active"))
    
    # Options for select/radio/checklist questions
    options = models.JSONField(
        blank=True,
        null=True,
        help_text=_("Options for select/radio/checklist questions")
    )
    
    # Conditional logic
    visible_if = models.JSONField(
        blank=True,
        null=True,
        help_text=_("Conditions for when this question should be visible")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['text']
        verbose_name = _("Question")
        verbose_name_plural = _("Questions")
    
    def __str__(self):
        return self.text[:50]
    
    def clean(self):
        # Validate options for appropriate question types
        if self.type in ['select', 'radio', 'checklist'] and not self.options:
            raise ValidationError(_("Options are required for select, radio, and checklist questions"))
        
        # Validate visible_if structure
        if self.visible_if:
            self._validate_visible_if()
    
    def _validate_visible_if(self):
        """Validate the structure of visible_if conditions."""
        if not isinstance(self.visible_if, dict):
            raise ValidationError(_("visible_if must be a dictionary"))
        
        for question_id, condition in self.visible_if.items():
            if not isinstance(condition, dict):
                raise ValidationError(_("Each condition must be a dictionary"))
            
            # Validate condition structure
            if 'operator' not in condition or 'value' not in condition:
                raise ValidationError(_("Each condition must have 'operator' and 'value' keys"))
            
            # Validate operator
            valid_operators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']
            if condition['operator'] not in valid_operators:
                raise ValidationError(_(f"Invalid operator. Must be one of: {', '.join(valid_operators)}"))


class QuestionSetQuestion(models.Model):
    """
    Junction table for many-to-many relationship between QuestionSet and Question.
    Allows for per-set customization of questions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_set = models.ForeignKey(
        QuestionSet,
        on_delete=models.CASCADE,
        related_name='question_set_questions',
        help_text=_("Question set this question belongs to")
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='question_set_questions',
        help_text=_("Question in this set")
    )
    order = models.PositiveIntegerField(default=0, help_text=_("Order of the question within the set"))
    is_required = models.BooleanField(default=False, help_text=_("Whether this question is required in this set"))
    overrides = models.JSONField(
        blank=True,
        null=True,
        help_text=_("Optional overrides for question text, options, or conditional logic")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['question_set', 'question']
        ordering = ['question_set', 'order']
        verbose_name = _("Question Set Question")
        verbose_name_plural = _("Question Set Questions")
    
    def __str__(self):
        return f"{self.question_set.name} - {self.question.text[:30]}"
    
    def get_effective_text(self):
        """Get the effective question text, considering overrides."""
        if self.overrides and 'text' in self.overrides:
            return self.overrides['text']
        return self.question.text
    
    def get_effective_options(self):
        """Get the effective options, considering overrides."""
        if self.overrides and 'options' in self.overrides:
            return self.overrides['options']
        return self.question.options
    
    def get_effective_visible_if(self):
        """Get the effective conditional logic, considering overrides."""
        if self.overrides and 'visible_if' in self.overrides:
            return self.overrides['visible_if']
        return self.question.visible_if


class Answer(models.Model):
    """
    User's answer to a question within a specific question set.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_set_question = models.ForeignKey(
        QuestionSetQuestion,
        on_delete=models.CASCADE,
        related_name='answers',
        help_text=_("Question set question this answer belongs to")
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='questionnaire_answers',
        help_text=_("User who provided this answer")
    )
    
    # Store answer based on question type
    text_answer = models.TextField(blank=True, null=True)
    number_answer = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    boolean_answer = models.BooleanField(blank=True, null=True)
    json_answer = models.JSONField(blank=True, null=True)  # For checklist, radio, select
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['question_set_question', 'user']
        verbose_name = _("Answer")
        verbose_name_plural = _("Answers")
    
    def __str__(self):
        return f"{self.user.email} - {self.question_set_question.question.text[:30]}"
    
    @property
    def question(self):
        """Get the question from the question set question."""
        return self.question_set_question.question
    
    @property
    def question_set(self):
        """Get the question set from the question set question."""
        return self.question_set_question.question_set
    
    @property
    def value(self):
        """Get the answer value based on question type."""
        if self.question.type == 'text':
            return self.text_answer
        elif self.question.type == 'textarea':
            return self.text_answer
        elif self.question.type == 'number':
            return self.number_answer
        elif self.question.type == 'boolean':
            return self.boolean_answer
        elif self.question.type in ['checklist', 'radio', 'select']:
            return self.json_answer
        return None
    
    @value.setter
    def value(self, val):
        """Set the answer value based on question type."""
        if self.question.type in ['text', 'textarea']:
            self.text_answer = str(val) if val is not None else None
        elif self.question.type == 'number':
            self.number_answer = val
        elif self.question.type == 'boolean':
            self.boolean_answer = bool(val) if val is not None else None
        elif self.question.type in ['checklist', 'radio', 'select']:
            self.json_answer = val
        else:
            raise ValueError(f"Unsupported question type: {self.question.type}")


class Dependency(models.Model):
    """
    Defines dependencies between questions for conditional logic.
    Now works with QuestionSetQuestion to handle per-set dependencies.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question_set = models.ForeignKey(
        QuestionSet,
        on_delete=models.CASCADE,
        related_name='dependencies',
        help_text=_("Question set this dependency belongs to")
    )
    dependent_question_set_question = models.ForeignKey(
        QuestionSetQuestion,
        on_delete=models.CASCADE,
        related_name='dependencies',
        help_text=_("Question set question that depends on another")
    )
    source_question_set_question = models.ForeignKey(
        QuestionSetQuestion,
        on_delete=models.CASCADE,
        related_name='dependent_questions',
        help_text=_("Question set question that the dependent question depends on")
    )
    condition = models.JSONField(
        help_text=_("Condition that must be met for the dependent question to be visible")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['question_set', 'dependent_question_set_question', 'source_question_set_question']
        verbose_name = _("Dependency")
        verbose_name_plural = _("Dependencies")
    
    def __str__(self):
        return f"{self.dependent_question_set_question.question.text[:30]} depends on {self.source_question_set_question.question.text[:30]}"
    
    def clean(self):
        # Prevent circular dependencies
        if (self.dependent_question_set_question and self.source_question_set_question and
            self.dependent_question_set_question == self.source_question_set_question):
            raise ValidationError(_("A question cannot depend on itself"))
        
        # Ensure both questions belong to the same question set
        if (self.dependent_question_set_question and self.source_question_set_question and
            self.dependent_question_set_question.question_set != self.source_question_set_question.question_set):
            raise ValidationError(_("Dependent and source questions must belong to the same question set"))
        
        # Validate condition structure
        if not isinstance(self.condition, dict):
            raise ValidationError(_("Condition must be a dictionary"))
        
        if 'operator' not in self.condition or 'value' not in self.condition:
            raise ValidationError(_("Condition must have 'operator' and 'value' keys")) 