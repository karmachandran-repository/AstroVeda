import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_dasha_transit_endpoints():
    print("--------------------------------------------------")
    print("STARTING VIMSHOTTARI DASHA & TRANSIT ROUTE TESTS")
    print("--------------------------------------------------")

    # Birth details parameter for testing (Delhi, May 15, 1995)
    birth_date = "1995-05-15"
    birth_time = "08:30"
    latitude = 28.6139
    longitude = 77.2090
    timezone_offset = 5.5

    # First, call calculate-chart to get natal placements (specifically Moon and Lagna coordinates)
    print("Pre-fetching birth coordinates...")
    chart_payload = {
        "name": "Dasha Test",
        "gender": "Male",
        "date": birth_date,
        "time": birth_time,
        "latitude": latitude,
        "longitude": longitude,
        "timezoneOffset": timezone_offset
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/calculate-chart", json=chart_payload)
        assert res.status_code == 200, f"Calculate-chart pre-fetch failed: {res.status_code}"
        chart_res = res.json()
        assert chart_res["success"] is True
        
        moon_long = chart_res["chartData"]["rashiPlacements"]["Moon"]["longitude"]
        lagna_long = chart_res["chartData"]["rashiPlacements"]["Lagna"]["longitude"]
        
        print(f"[SUCCESS] Natal Coordinates: Moon={moon_long:.4f}°, Lagna={lagna_long:.4f}°")
    except Exception as e:
        print(f"[FAIL] Natal Coordinate retrieval failed: {e}")
        return

    # 1. Test POST /api/dasha/timeline (10-year view / Antardashas)
    print("\nTesting POST /api/dasha/timeline (10-year zoom view)...")
    dasha_payload_10y = {
        "moonLongitude": moon_long,
        "birthDate": birth_date,
        "startDate": "2026-05-24T00:00:00",
        "yearsSpan": 10
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/dasha/timeline", json=dasha_payload_10y)
        assert res.status_code == 200, f"POST /api/dasha/timeline 10y failed: {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "timeline" in data
        
        timeline = data["timeline"]
        print(f"[SUCCESS] Timeline returned {len(timeline)} segments for 10-year view.")
        if len(timeline) > 0:
            example = timeline[0]
            print(f"[SUCCESS] Segment Example (10y): {example['label']} ({example['startDate']} to {example['endDate']})")
            assert "mahadasha" in example
            assert "antardasha" in example
            assert "tier" in example
            assert example["tier"] == "AD"
            
    except Exception as e:
        print(f"[FAIL] 10-year Dasha Timeline verification failed: {e}")
        return

    # 2. Test POST /api/dasha/timeline (1-year zoom view / Pratyantardashas)
    print("\nTesting POST /api/dasha/timeline (1-year zoom view / Pratyantardashas)...")
    dasha_payload_1y = {
        "moonLongitude": moon_long,
        "birthDate": birth_date,
        "startDate": "2026-05-24T00:00:00",
        "yearsSpan": 1
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/dasha/timeline", json=dasha_payload_1y)
        assert res.status_code == 200, f"POST /api/dasha/timeline 1y failed: {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "timeline" in data
        
        timeline = data["timeline"]
        print(f"[SUCCESS] Timeline returned {len(timeline)} segments for 1-year view.")
        if len(timeline) > 0:
            example = timeline[0]
            print(f"[SUCCESS] Segment Example (1y): {example['label']} ({example['startDate']} to {example['endDate']})")
            assert "mahadasha" in example
            assert "antardasha" in example
            assert "pratyantardasha" in example
            assert "tier" in example
            assert example["tier"] == "PD"
            
    except Exception as e:
        print(f"[FAIL] 1-year Dasha Timeline verification failed: {e}")
        return

    # 3. Test POST /api/transit/overlay
    print("\nTesting POST /api/transit/overlay (Transit-to-Birth Houses mapping)...")
    transit_payload = {
        "lagnaLongitude": lagna_long,
        "transitDate": "2026-05-24",
        "transitTime": "12:00",
        "timezoneOffset": 0.0
    }
    
    try:
        res = requests.post(f"{BASE_URL}/api/transit/overlay", json=transit_payload)
        assert res.status_code == 200, f"POST /api/transit/overlay failed: {res.status_code}"
        data = res.json()
        assert data["success"] is True
        assert "overlay" in data
        
        overlay = data["overlay"]
        print("[SUCCESS] Transit Overlay calculated successfully!")
        
        planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
        for p in planets:
            assert p in overlay, f"Planet {p} missing from transit overlay mapping"
            p_data = overlay[p]
            assert "house" in p_data, f"House key missing for {p} in transit overlay"
            assert 1 <= p_data["house"] <= 12, f"Invalid house position {p_data['house']} for {p}"
            assert "interpretation" in p_data, f"Interpretation missing for {p} transit in house"
            
            if p == "Jupiter":
                print(f"[SUCCESS] Jupiter Transit: House {p_data['house']}, Interpretation: \"{p_data['interpretation']}\"")
                
    except Exception as e:
        print(f"[FAIL] Transit Overlay verification failed: {e}")
        return

    print("\n==================================================")
    print("ALL VIMSHOTTARI DASHA & TRANSIT ROUTE TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_dasha_transit_endpoints()
