"""
Simple test script to verify MongoDB connection.
Run this to test if the MongoDB setup is working correctly.
"""
import os
import sys
import django

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from mongo_utils.mongo_connection import get_mongo_connection
from mongo_utils.mongo_models import MongoQuestion, MongoForm

def test_mongo_connection():
    """Test MongoDB connection and basic operations."""
    try:
        print("Testing MongoDB connection...")
        
        # Connect to MongoDB
        get_mongo_connection()
        
        # Test creating a simple question
        test_question = MongoQuestion(
            _id="test_question_001",
            text="Test question for connection verification",
            type="text",
            required=False
        )
        test_question.save()
        print("✓ Successfully created test question")
        
        # Test retrieving the question
        retrieved_question = MongoQuestion.objects(_id="test_question_001").first()
        if retrieved_question:
            print(f"✓ Successfully retrieved question: {retrieved_question.text}")
        else:
            print("✗ Failed to retrieve question")
            return False
        
        # Test creating a simple form
        test_form = MongoForm(
            _id="test_form_001",
            title="Test Form",
            description="Test form for connection verification",
            questions=[
                {
                    "question_id": test_question._id,
                    "order": 1,
                    "required": False
                }
            ]
        )
        test_form.save()
        print("✓ Successfully created test form")
        
        # Test retrieving the form
        retrieved_form = MongoForm.objects(_id="test_form_001").first()
        if retrieved_form:
            print(f"✓ Successfully retrieved form: {retrieved_form.title}")
        else:
            print("✗ Failed to retrieve form")
            return False
        
        # Clean up test data
        test_question.delete()
        test_form.delete()
        print("✓ Cleaned up test data")
        
        print("\n🎉 MongoDB connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ MongoDB connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_mongo_connection() 