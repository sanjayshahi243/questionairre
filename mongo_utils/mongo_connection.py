import os
from mongoengine import connect, disconnect
from django.conf import settings

def get_mongo_connection():
    """
    Get MongoDB connection using environment variables.
    Falls back to default values for local development.
    """
    # Get MongoDB connection details from environment variables
    mongo_host = os.getenv('MONGO_HOST', 'mongodb')
    mongo_port = int(os.getenv('MONGO_PORT', 27017))
    mongo_username = os.getenv('MONGO_USERNAME', 'admin')
    mongo_password = os.getenv('MONGO_PASSWORD', 'password')
    mongo_database = os.getenv('MONGO_DATABASE', 'questionairre')
    
    # Build connection string
    if mongo_username and mongo_password:
        connection_string = f"mongodb://{mongo_username}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_database}?authSource=admin"
    else:
        connection_string = f"mongodb://{mongo_host}:{mongo_port}/{mongo_database}"
    
    # Connect to MongoDB with alias to avoid conflicts
    try:
        connect(db=mongo_database, host=connection_string, alias='default')
        print(f"Connected to MongoDB at {mongo_host}:{mongo_port}")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        # For development, try without authentication
        try:
            connection_string = f"mongodb://{mongo_host}:{mongo_port}/{mongo_database}"
            connect(db=mongo_database, host=connection_string, alias='default')
            print(f"Connected to MongoDB without authentication at {mongo_host}:{mongo_port}")
        except Exception as e2:
            print(f"Failed to connect to MongoDB without authentication: {e2}")
            raise

def close_mongo_connection():
    """Close MongoDB connection."""
    disconnect(alias='default') 