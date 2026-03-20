import base64
import requests
import sys

image_path = sys.argv[1]
api_url = "https://smartattendance.up.railway.app/enroll"

with open(image_path, "rb") as image_file:
    base64_string = base64.b64encode(image_file.read()).decode('utf-8')

payload = {"image": base64_string}

print(f"Sending POST request to {api_url}...")
try:
    response = requests.post(api_url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
