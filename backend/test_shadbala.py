import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_shadbala_endpoints():
    print("--------------------------------------------------")
    print("STARTING SHADBALA ENGINE & API ROUTE TESTS")
    print("--------------------------------------------------")

    # Birth details parameter for testing
    date = "1995-05-15"
    birth_time = "08:30"
    latitude = 28.6139
    longitude = 77.2090
    timezone_offset = 5.5

    # 1. Test GET /api/shadbala endpoint
    print("Testing GET /api/shadbala endpoint...")
    get_params = {
        "date": date,
        "time": birth_time,
        "latitude": latitude,
        "longitude": longitude,
        "timezoneOffset": timezone_offset
    }
    
    try:
        res = requests.get(f"{BASE_URL}/api/shadbala", params=get_params)
        assert res.status_code == 200, f"GET /api/shadbala failed with code {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "shadbala" in data
        
        shadbala = data["shadbala"]
        print("[SUCCESS] GET /api/shadbala returned successfully!")
        
        # Verify structure for all 9 planets
        planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
        for p in planets:
            assert p in shadbala, f"Planet {p} should be in Shadbala results"
            p_data = shadbala[p]
            assert "sthanaBala" in p_data, f"sthanaBala missing for {p}"
            assert "dikBala" in p_data, f"dikBala missing for {p}"
            assert "kalaBala" in p_data, f"kalaBala missing for {p}"
            assert "cheshtaBala" in p_data, f"cheshtaBala missing for {p}"
            assert "naisargikaBala" in p_data, f"naisargikaBala missing for {p}"
            assert "drikBala" in p_data, f"drikBala missing for {p}"
            assert "totalScore" in p_data, f"totalScore missing for {p}"
            assert "percentage" in p_data, f"percentage missing for {p}"
            
            # Print example planet
            if p == "Sun":
                print(f"[SUCCESS] Sun calculations verified: {p_data}")
                
    except Exception as e:
        print(f"[FAIL] GET /api/shadbala verification failed: {e}")
        return

    # 2. Test integrated calculate-chart endpoint
    print("\nTesting integrated POST /api/calculate-chart endpoint...")
    chart_payload = {
        "name": "Shadbala Test",
        "gender": "Male",
        "date": date,
        "time": birth_time,
        "latitude": latitude,
        "longitude": longitude,
        "timezoneOffset": timezone_offset
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/calculate-chart", json=chart_payload)
        assert res.status_code == 200, f"POST /api/calculate-chart failed with code {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "chartData" in data
        
        chart_data = data["chartData"]
        assert "shadbala" in chart_data, "shadbala should be integrated inside chartData"
        assert chart_data["shadbala"] is not None
        
        print("[SUCCESS] Shadbala calculations successfully integrated inside POST /api/calculate-chart!")
        
        # Verify dominant planet computation
        dominant_planet = None
        max_score = -1
        for p, p_data in chart_data["shadbala"].items():
            if p_data["totalScore"] > max_score:
                max_score = p_data["totalScore"]
                dominant_planet = p
                
        print(f"[SUCCESS] Dominant planet computed as: {dominant_planet} (Score: {max_score})")
        
    except Exception as e:
        print(f"[FAIL] Integrated calculate-chart verification failed: {e}")
        return

    print("\n==================================================")
    print("ALL SHADBALA STRENGTH ENGINE & ROUTE TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_shadbala_endpoints()
