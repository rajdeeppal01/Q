import requests

url = 'https://q-f8z0.onrender.com/auth/register'
data = {
    "name": "Rajdeep Pal",
    "email": "rajdeep.pal2004@gmail.com",
    "password": "password123"
}

try:
    res = requests.post(url, json=data)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
