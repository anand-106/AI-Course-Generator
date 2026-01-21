
import requests
import jwt
import datetime
import json
import sys

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

def create_token(email):
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def test_generate():
    token = create_token("testuser@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Sending generation request...")
    url = "http://localhost:8000/course/generate"
    data = {"prompt": "Learn JSON in 5 minutes"}
    
    try:
        with requests.post(url, json=data, headers=headers, stream=True) as r:
            if r.status_code != 200:
                print(f"Error: {r.status_code} {r.text}")
                return

            print("Stream started. Reading...")
            for line in r.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    try:
                        event = json.loads(decoded_line)
                        print(f"Event: {event.get('type')}")
                        if event.get('type') == 'complete':
                            print("Received COMPLETE event.")
                            print(f"Course ID: {event.get('course_id')}")
                    except:
                        pass
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_generate()
