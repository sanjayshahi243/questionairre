"""
Django management command to initialize MongoDB with sample data.
Usage: python manage.py init_mongo
"""
from django.core.management.base import BaseCommand
from mongo_utils.mongo_connection import get_mongo_connection
from mongo_utils.mongo_models import MongoQuestion, MongoForm
from bson import ObjectId

class Command(BaseCommand):
    help = 'Initialize MongoDB with sample questions and forms'

    def handle(self, *args, **options):
        try:
            # Connect to MongoDB
            get_mongo_connection()
            
            # Clear existing data
            MongoQuestion.objects.delete()
            MongoForm.objects.delete()
            
            self.stdout.write("Cleared existing MongoDB data")
            
            # Create sample questions
            questions = [
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="What is your name?",
                    type="text",
                    required=True
                ),
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="How old are you?",
                    type="number",
                    required=True,
                    validation_rules={"min": 0, "max": 120}
                ),
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="Do you have any allergies?",
                    type="boolean",
                    required=False
                ),
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="What is your favorite color?",
                    type="select",
                    options=["Red", "Blue", "Green", "Yellow", "Purple", "Orange"],
                    required=False
                ),
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="Which programming languages do you know?",
                    type="multiselect",
                    options=["Python", "JavaScript", "Java", "C++", "Go", "Rust"],
                    required=False
                ),
                MongoQuestion(
                    _id=str(ObjectId()),
                    text="When is your birthday?",
                    type="date",
                    required=False
                )
            ]
            
            # Save questions
            for question in questions:
                question.save()
                self.stdout.write(f"Created question: {question.text}")
            
            # Create sample forms
            form1 = MongoForm(
                _id=str(ObjectId()),
                title="Basic Information Form",
                description="A simple form to collect basic user information",
                questions=[
                    {
                        "question_id": questions[0]._id,  # Name
                        "order": 1,
                        "required": True
                    },
                    {
                        "question_id": questions[1]._id,  # Age
                        "order": 2,
                        "required": True
                    },
                    {
                        "question_id": questions[2]._id,  # Allergies
                        "order": 3,
                        "required": False
                    }
                ]
            )
            form1.save()
            self.stdout.write(f"Created form: {form1.title}")
            
            form2 = MongoForm(
                _id=str(ObjectId()),
                title="Preferences Survey",
                description="A survey about personal preferences",
                questions=[
                    {
                        "question_id": questions[3]._id,  # Favorite color
                        "order": 1,
                        "required": False
                    },
                    {
                        "question_id": questions[4]._id,  # Programming languages
                        "order": 2,
                        "required": False
                    },
                    {
                        "question_id": questions[5]._id,  # Birthday
                        "order": 3,
                        "required": False
                    }
                ]
            )
            form2.save()
            self.stdout.write(f"Created form: {form2.title}")
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nMongoDB initialization completed successfully!\n"
                    f"Created {len(questions)} questions and 2 forms"
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error initializing MongoDB data: {e}")
            )
            raise 