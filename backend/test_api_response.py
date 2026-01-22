
import requests
import json

REPO_ID = "697228640d69d8b88ab1cbf6" # From mock_db_data.json check
URL = f"http://localhost:8000/api/repos/{REPO_ID}/stats"

try:
    print(f"Requesting: {URL}")
    resp = requests.get(URL)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Response JSON:")
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
