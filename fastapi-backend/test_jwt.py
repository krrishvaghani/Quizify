import requests

data = {
    "email": "test@example.com",
    "password": "password"
}
# Using a common password or we might fail. Let's just create a test user.
try:
    requests.post("http://127.0.0.1:8000/api/auth/signup", json={"name": "test", "email": "testjwt@example.com", "password": "password123", "role": "user"})
except Exception as e:
    pass

response = requests.post("http://127.0.0.1:8000/api/auth/login", json={"email": "testjwt@example.com", "password": "password123"})
print(response.json())
