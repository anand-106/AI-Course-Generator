
from db import courses_collection, client
import os
from dotenv import load_dotenv

print("Checking DB connection...")
if courses_collection is None:
    print("courses_collection is None!")
else:
    print(f"courses_collection is set: {courses_collection}")
    try:
        # Try a simple operation
        count = courses_collection.count_documents({})
        print(f"Connection successful. Document count: {count}")
    except Exception as e:
        print(f"Error connecting: {e}")
