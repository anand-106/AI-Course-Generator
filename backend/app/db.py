from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv
import os
from pathlib import Path

# Go two levels up (app -> backend -> project root)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

print(f"🔎 Loading .env from: {env_path}")  # Debug log

MONGO_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

print(f"📌 MONGO_URI Loaded: {MONGO_URI is not None}")
print(f"📌 DATABASE_NAME Loaded: {DATABASE_NAME}")

if not MONGO_URI:
    raise ValueError("❌ MONGODB_URI not found in .env file!")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas!")
except ServerSelectionTimeoutError as e:
    raise ConnectionError(f"❌ Could not connect to MongoDB: {e}")

db = client[DATABASE_NAME]
users_collection = db["users"]
