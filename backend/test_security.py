import json
import pyotp
import requests
import time

BASE_URL = "http://127.0.0.1:5000"

def test_security_flow():
    print("--------------------------------------------------")
    print("STARTING SECURITY & MFA INTEGRATION TESTS")
    print("--------------------------------------------------")

    # 1. Test Dynamic Config endpoint
    try:
        res = requests.get(f"{BASE_URL}/api/auth/config")
        assert res.status_code == 200, "Config endpoint should be accessible"
        config_data = res.json()
        print(f"[SUCCESS] Dynamic Config fetched successfully: {config_data}")
    except Exception as e:
        print(f"[FAIL] Config verification failed: {e}")
        return

    # 2. Register a new user
    username = f"testuser_{int(time.time())}"
    password = "supersecurepassword123"
    
    register_payload = {
        "username": username,
        "password": password
    }
    
    print(f"Registering new test user: '{username}'...")
    res = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
    if res.status_code != 200:
        print(f"[FAIL] Registration failed: {res.text}")
        return
        
    reg_data = res.json()
    assert reg_data["success"] is True
    token = reg_data["token"]
    print(f"[SUCCESS] Registration successful! Access Token: {token[:20]}...")

    # 3. Standard login without 2FA
    print("Attempting standard login without 2FA...")
    login_payload = {
        "username": username,
        "password": password
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    assert res.status_code == 200
    login_data = res.json()
    assert login_data["success"] is True
    assert login_data["require2fa"] is False
    print("[SUCCESS] Login successful without 2FA challenge.")

    # 4. Initialize 2FA Setup
    print("Initializing 2FA Setup...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    res = requests.post(f"{BASE_URL}/api/auth/2fa/setup", headers=headers)
    assert res.status_code == 200
    setup_data = res.json()
    assert setup_data["success"] is True
    totp_secret = setup_data["secret"]
    otpauth_uri = setup_data["otpauthUri"]
    print(f"[SUCCESS] 2FA Secret Key generated: {totp_secret}")
    print(f"[SUCCESS] 2FA Provisioning URI generated: {otpauth_uri}")

    # 5. Enable 2FA by verifying the first code
    totp = pyotp.TOTP(totp_secret)
    current_code = totp.now()
    print(f"Enabling 2FA with current verification code: {current_code}...")
    enable_payload = {
        "code": current_code
    }
    res = requests.post(f"{BASE_URL}/api/auth/2fa/enable", json=enable_payload, headers=headers)
    assert res.status_code == 200
    enable_data = res.json()
    assert enable_data["success"] is True
    print("[SUCCESS] 2FA enabled successfully!")

    # 6. Attempt login again - Expect 2FA Challenge Interception
    print("Attempting login again with 2FA enabled...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    assert res.status_code == 200
    login_challenge_data = res.json()
    assert login_challenge_data["success"] is False
    assert login_challenge_data["require2fa"] is True
    print("[SUCCESS] Login intercepted successfully! 2FA verification is required.")

    # 7. Verify OTP Code and request 30-Day Trusted Device bypass token
    current_code = totp.now()
    print(f"Submitting OTP code {current_code} for login verification + Trusted Device request...")
    verify_payload = {
        "username": username,
        "code": current_code,
        "trustDevice": True
    }
    client_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Accept-Language": "en-US,en;q=0.9"
    }
    res = requests.post(f"{BASE_URL}/api/auth/2fa/verify", json=verify_payload, headers=client_headers)
    assert res.status_code == 200
    verify_data = res.json()
    assert verify_data["success"] is True
    session_token = verify_data["token"]
    trusted_device_token = verify_data["trustedDeviceToken"]
    assert trusted_device_token is not None, "Trusted device token must be issued"
    print(f"[SUCCESS] Verification code accepted! Session Token: {session_token[:20]}...")
    print(f"[SUCCESS] Trusted Device Token issued: {trusted_device_token[:40]}...")

    # 8. Try Login with Trusted Device Bypass header
    print("Attempting login with 'x-trusted-device' header to bypass 2FA check...")
    bypass_headers = client_headers.copy()
    bypass_headers["x-trusted-device"] = trusted_device_token
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=bypass_headers)
    assert res.status_code == 200
    bypass_login_data = res.json()
    assert bypass_login_data["success"] is True
    assert bypass_login_data["require2fa"] is False
    print("[SUCCESS] Success! Trusted device bypass token successfully skipped the 2FA challenge!")

    # 9. Try Login with altered headers (Simulate cookie theft or device signature change)
    print("Attempting login with trusted device token but altered User-Agent...")
    stolen_headers = client_headers.copy()
    stolen_headers["User-Agent"] = "Stolen Browser User Agent / HackBot 9000"
    stolen_headers["x-trusted-device"] = trusted_device_token
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=stolen_headers)
    assert res.status_code == 200
    stolen_login_data = res.json()
    assert stolen_login_data["success"] is False
    assert stolen_login_data["require2fa"] is True
    print("[SUCCESS] Security check passed! Altered device signatures reject the trusted bypass safely.")

    print("\n==================================================")
    print("ALL SECURITY & MFA FLOW TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_security_flow()
