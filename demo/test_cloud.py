import urllib.request
import json
import traceback

def test_cloud_api():
    url = "https://q-f8z0.onrender.com/agents"
    try:
        print(f"Fetching {url}...")
        req = urllib.request.Request(url, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer dummy_token_for_mvp'})
        response = urllib.request.urlopen(req)
        print("Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
    except Exception as e:
        print("Exception:", e)
        if hasattr(e, 'read'):
            print("Error body:", e.read().decode('utf-8'))

test_cloud_api()
