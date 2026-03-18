import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/auth/signup'
data = {'name': 'test_user', 'email': 'test@example.com', 'password': 'password123'}
req = urllib.request.Request(url, json.dumps(data).encode('utf-8'), {'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Response:", response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response:", e.read().decode())
except Exception as e:
    print("Error:", e)
