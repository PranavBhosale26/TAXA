import requests
import random
import string

BASE_URL = "http://127.0.0.1:8000"

def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run_tests():
    print("=== STARTING TAXA SYSTEM SECURITY HANDSHAKE TESTS ===")

    # Test 1: Accessing protected endpoint without token
    print("\n[Test 1] Accessing protected endpoint without token...")
    res = requests.get(f"{BASE_URL}/api/sessions/pranav")
    print(f"Status Code: {res.status_code} (Expected: 401)")
    assert res.status_code == 401, f"Failed! Expected 401, got {res.status_code}"
    print("Success: Blocked anonymous access.")

    # Test 2: Accessing protected endpoint with invalid token
    print("\n[Test 2] Accessing protected endpoint with invalid token...")
    headers = {"Authorization": "Bearer invalid_token_xyz"}
    res = requests.get(f"{BASE_URL}/api/sessions/pranav", headers=headers)
    print(f"Status Code: {res.status_code} (Expected: 401)")
    assert res.status_code == 401, f"Failed! Expected 401, got {res.status_code}"
    print("Success: Blocked spoofed token access.")

    # Test 3: Incorrect password login
    print("\n[Test 3] Attempting login with incorrect credentials...")
    login_data = {
        "username": "non_existent_user_1234",
        "password": "wrongpassword"
    }
    res = requests.post(f"{BASE_URL}/api/login", json=login_data)
    print(f"Status Code: {res.status_code} (Expected: 401)")
    assert res.status_code == 401, f"Failed! Expected 401, got {res.status_code}"
    print("Success: Rejected bad login.")

    # Test 4: Correct Registration and Login flow
    username = f"user_{get_random_string()}"
    password = "SecurePassword123!"
    print(f"\n[Test 4] Registering test user: {username}...")
    reg_data = {
        "username": username,
        "password": password
    }
    res = requests.post(f"{BASE_URL}/api/register", json=reg_data)
    print(f"Registration Status Code: {res.status_code} (Expected: 200)")
    assert res.status_code == 200, f"Failed registration! got {res.status_code}"
    
    print("Attempting login with valid credentials...")
    res = requests.post(f"{BASE_URL}/api/login", json=reg_data)
    print(f"Login Status Code: {res.status_code} (Expected: 200)")
    assert res.status_code == 200, f"Failed login! got {res.status_code}"
    token_data = res.json()
    token = token_data.get("access_token")
    assert token is not None, "Token missing in login response"
    print("Success: Token successfully issued.")

    # Test 5: Verify Token endpoint
    print("\n[Test 5] Checking verify-token endpoint with our new JWT...")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/verify-token", headers=headers)
    print(f"Verify-Token Status Code: {res.status_code} (Expected: 200)")
    assert res.status_code == 200, f"Failed verify-token! got {res.status_code}"
    print(f"Response: {res.json()}")
    print("Success: Token successfully verified.")

    # Test 6: Accessing own sessions
    print(f"\n[Test 6] Accessing own sessions for {username}...")
    res = requests.get(f"{BASE_URL}/api/sessions/{username}", headers=headers)
    print(f"Get Sessions Status Code: {res.status_code} (Expected: 200)")
    assert res.status_code == 200, f"Failed get sessions! got {res.status_code}"
    print("Success: Accessed own database sandbox.")

    # Test 7: Multi-User Isolation Check (Accessing other user's sessions)
    other_username = f"user_{get_random_string()}"
    print(f"\n[Test 7] Accessing another user's sandbox ({other_username}) using {username}'s token...")
    res = requests.get(f"{BASE_URL}/api/sessions/{other_username}", headers=headers)
    print(f"Get Sessions Status Code: {res.status_code} (Expected: 403)")
    assert res.status_code == 403, f"Failed! Expected 403 Forbidden, got {res.status_code}"
    print("Success: Secure isolation! Multi-user sandbox breach prevented.")

    print("\n=== ALL SECURITY HANDSHAKE TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
