
import requests
import json

URL = "http://localhost:8000/api/repos"
DATA = {
    "name": "API Test Car",
    "branch": "master",
    "current_mileage": 0
}

try:
    print(f"Creating Repo at: {URL}")
    resp = requests.post(URL, json=DATA)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Failed: {e}")
