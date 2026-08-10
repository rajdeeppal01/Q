import httpx
import random
import string

def get_random_string(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run_auth_test():
    base_url = "https://q-f8z0.onrender.com"
    
    email = f"test_{get_random_string(6)}@example.com"
    password = "password123"
    name = "Test User"
    
    print(f"Testing Auth flow for user: {email}")
    
    # 1. Register User
    print("\n--- 1. Registering User ---")
    register_response = httpx.post(f"{base_url}/auth/register", json={
        "email": email,
        "password": password,
        "name": name
    })
    
    if register_response.status_code != 201:
        print(f"FAILED to register: {register_response.status_code} {register_response.text}")
        return
        
    token = register_response.json().get("access_token")
    print(f"SUCCESS: Received token: {token[:20]}...")
    
    # 2. Login User
    print("\n--- 2. Logging in User ---")
    login_response = httpx.post(f"{base_url}/auth/login", data={
        "username": email,
        "password": password
    })
    
    if login_response.status_code != 200:
        print(f"FAILED to login: {login_response.status_code} {login_response.text}")
        return
        
    token = login_response.json().get("access_token")
    print(f"SUCCESS: Received token: {token[:20]}...")
    
    # 3. Access Protected Route WITH Token
    print("\n--- 3. Accessing /auth/me WITH Token ---")
    protected_response = httpx.get(f"{base_url}/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    
    if protected_response.status_code != 200:
        print(f"FAILED to access protected route: {protected_response.status_code} {protected_response.text}")
        return
        
    print(f"SUCCESS: Identified as {protected_response.json().get('email')}")
    
    # 4. Access Protected Route WITHOUT Token
    print("\n--- 4. Accessing /auth/me WITHOUT Token ---")
    unauth_response = httpx.get(f"{base_url}/auth/me")
    
    if unauth_response.status_code == 401:
        print("SUCCESS: Route correctly rejected unauthorized access (401).")
    else:
        print(f"FAILED: Route returned {unauth_response.status_code} instead of 401.")
        return
        
    print("\n✅ All Auth tests passed!")

if __name__ == "__main__":
    run_auth_test()
