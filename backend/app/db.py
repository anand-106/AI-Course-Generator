from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print(f"[INFO] Loading .env from: {env_path}")

MONGO_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")


if MONGO_URI:
    MONGO_URI = MONGO_URI.strip('"').strip("'")
if DATABASE_NAME:
    DATABASE_NAME = DATABASE_NAME.strip('"').strip("'")

print(f"[INFO] MONGO_URI Loaded: {MONGO_URI is not None}")
print(f"[INFO] DATABASE_NAME Loaded: {DATABASE_NAME}")

client = None
db = None
users_collection = None
connection_error = None

# Export connection_error for use in routers
__all__ = ['client', 'db', 'users_collection', 'connection_error']

if not MONGO_URI:
    print("[ERROR] MONGODB_URI not found in .env file!")
    print("[ERROR] Please add MONGODB_URI to your .env file in the project root.")
    connection_error = "MONGODB_URI not configured in .env file"
else:
    try:
        print(f"[INFO] Attempting to connect to MongoDB...")
        print(f"[INFO] Connection string: {MONGO_URI[:50]}..." if len(MONGO_URI) > 50 else f"[INFO] Connection string: {MONGO_URI}")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=15000)
        client.admin.command("ping")
        print("[SUCCESS] Connected to MongoDB Atlas!")
        if not DATABASE_NAME:
            DATABASE_NAME = "ai_course_generator"
            print(f"[INFO] Using default database name: {DATABASE_NAME}")
        db = client[DATABASE_NAME]
        users_collection = db["users"]
        print(f"[SUCCESS] Using database: {DATABASE_NAME}")
        print(f"[SUCCESS] Collection 'users' is ready!")
    except ServerSelectionTimeoutError as e:
        connection_error = f"Connection timeout: Could not reach MongoDB server. Check your network connection and IP whitelist in MongoDB Atlas."
        print(f"[ERROR] {connection_error}")
        print(f"[ERROR] Full error: {e}")
    except ConfigurationError as e:
        connection_error = f"Invalid MongoDB connection string. Please check your MONGODB_URI format."
        print(f"[ERROR] {connection_error}")
        print(f"[ERROR] Full error: {e}")
    except Exception as e:
        connection_error = f"MongoDB connection failed: {str(e)}"
        print(f"[ERROR] {connection_error}")
        print(f"[ERROR] Error type: {type(e).__name__}")
