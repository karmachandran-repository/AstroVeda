import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_oauth_endpoints():
    print("--------------------------------------------------")
    print("STARTING OAUTH2 LINKEDIN & MICROSOFT ROUTE TESTS")
    print("--------------------------------------------------")

    # 1. Test POST /api/auth/linkedin
    print("Testing POST /api/auth/linkedin...")
    li_payload = {
        "code": "test_linkedin_authorization_code"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/auth/linkedin", json=li_payload)
        assert res.status_code == 200, f"LinkedIn login failed with code {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "token" in data
        assert "username" in data
        assert data["username"] == "li_sage"
        print("[SUCCESS] LinkedIn OAuth2 login successfully authenticated!")
    except Exception as e:
        print(f"[FAIL] LinkedIn OAuth2 login failed: {e}")
        return

    # 2. Test POST /api/auth/microsoft
    print("\nTesting POST /api/auth/microsoft...")
    ms_payload = {
        "code": "test_microsoft_authorization_code"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/auth/microsoft", json=ms_payload)
        assert res.status_code == 200, f"Microsoft login failed with code {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "token" in data
        assert "username" in data
        assert data["username"] == "ms_voyager"
        print("[SUCCESS] Microsoft OAuth2 login successfully authenticated!")
    except Exception as e:
        print(f"[FAIL] Microsoft OAuth2 login failed: {e}")
        return

    print("\n==================================================")
    print("ALL LINKEDIN & MICROSOFT OAUTH2 TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_oauth_endpoints()
