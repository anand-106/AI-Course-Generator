from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError
from dotenv import load_dotenv
import os
from pathlib import Path

# Go two levels up (app -> backend -> project root)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print(f"[INFO] Loading .env from: {env_path}")  # Debug log

MONGO_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

print(f"[INFO] MONGO_URI Loaded: {MONGO_URI is not None}")
print(f"[INFO] DATABASE_NAME Loaded: {DATABASE_NAME}")

# Initialize variables
client = None
db = None
users_collection = None

if not MONGO_URI:
    print("[WARNING] MONGODB_URI not found in .env file! Server will start but database features will not work.")
else:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        print("[SUCCESS] Connected to MongoDB Atlas!")
        db = client[DATABASE_NAME]
        users_collection = db["users"]
    except (ServerSelectionTimeoutError, ConfigurationError, Exception) as e:
        print(f"[WARNING] Could not connect to MongoDB: {e}")
        print("[WARNING] Server will start but database features will not work.")
        print("[WARNING] Please check your MONGODB_URI in the .env file.")
