from mongoengine import Document, StringField, ListField, DictField, BooleanField, IntField, DateTimeField
from datetime import datetime

class MongoQuestion(Document):
    """
    MongoDB model for storing dynamic questions.
    Supports flexible question types and configurations.
    """
    _id = StringField(primary_key=True)
    text = StringField(required=True)
    type = StringField(required=True, choices=['text', 'number', 'boolean', 'select', 'multiselect', 'date'])
    options = ListField(StringField(), default=[])  # For select/multiselect questions
    required = BooleanField(default=False)
    default_value = StringField()
    validation_rules = DictField(default={})  # Custom validation rules
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'db_alias': 'default',
        'collection': 'questions',
        'indexes': [
            'text',
            'type',
            'required'
        ]
    }
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

class MongoForm(Document):
    """
    MongoDB model for storing dynamic forms.
    Forms contain references to questions with ordering and conditional logic.
    """
    _id = StringField(primary_key=True)
    title = StringField(required=True)
    description = StringField()
    questions = ListField(DictField(), default=[])  # List of question references with metadata
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'db_alias': 'default',
        'collection': 'forms',
        'indexes': [
            'title',
            'is_active'
        ]
    }
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs) 