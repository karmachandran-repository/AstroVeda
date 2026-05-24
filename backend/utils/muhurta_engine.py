import datetime
from functools import lru_cache
from utils.astro_engine import calculate_planets, get_julian_day, norm360, get_nakshatra

SUITABLE_NAKSHATRAS = {
    "marriage": [4, 5, 10, 11, 12, 13, 14, 15, 17, 19, 21, 22, 26, 27],
    "naming": [1, 4, 5, 7, 8, 11, 12, 13, 14, 15, 17, 21, 22, 23, 24, 26, 27],
    "venture": [1, 4, 5, 7, 8, 11, 12, 13, 14, 17, 21, 22, 23, 27],
    "groundbreaking": [4, 5, 12, 14, 17, 21, 23, 24, 26],
    "travel": [1, 5, 7, 8, 13, 17, 22, 23, 24, 27],
    "job": [4, 5, 11, 13, 14, 17, 21, 22, 23, 26, 27]
}

INAUSPICIOUS_YOGAS = [
    "Vishkumbha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"
]

INAUSPICIOUS_KARANAS = [
    "Vishti (Bhadra)"
]

RIKTA_TITHIS = [4, 9, 14, 19, 24, 29]

VARA_SUITABILITY = {
    # 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    "marriage": {0: 0.5, 1: 0.9, 2: 0.2, 3: 0.8, 4: 0.9, 5: 0.9, 6: 0.3},
    "naming": {0: 0.7, 1: 0.9, 2: 0.2, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.4},
    "venture": {0: 0.9, 1: 0.9, 2: 0.3, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.5},
    "groundbreaking": {0: 0.4, 1: 0.9, 2: 0.1, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.2},
    "travel": {0: 0.5, 1: 0.8, 2: 0.2, 3: 0.9, 4: 0.9, 5: 0.9, 6: 0.3},
    "job": {0: 0.6, 1: 0.8, 2: 0.4, 3: 0.9, 4: 1.0, 5: 0.9, 6: 0.4}
}

NAKSHATRAS_LIST = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

YOGAS_LIST = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
    "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
    "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
]

TITHI_NAMES = [
    "Prathama (1)", "Dwitiya (2)", "Tritiya (3)", "Chaturthi (4)", "Panchami (5)", "Shasthi (6)", "Saptami (7)", "Ashtami (8)",
    "Navami (9)", "Dashami (10)", "Ekadashi (11)", "Dwadashi (12)", "Trayodashi (13)", "Chaturdashi (14)", "Purnima (15)"
]

@lru_cache(maxsize=1000)
def calculate_day_panchanga(date_obj, lat, lon, tz_offset):
    year = date_obj.year
    month = date_obj.month
    day = date_obj.day
    
    # Standardize to noon (12:00:00 PM) for daily Panchanga calculations
    jd = get_julian_day(year, month, day, 12, 0, 0, tz_offset)
    planets, _ = calculate_planets(jd)
    
    # 1. Vara (Day of week)
    # Python weekday(): 0=Monday, 6=Sunday
    py_weekday = date_obj.weekday()
    # Convert Python (0=Mon, 6=Sun) to standard (0=Sun, 1=Mon, ..., 6=Sat)
    day_of_week = (py_weekday + 1) % 7
    VARAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    vara = VARAS[day_of_week]
    
    # 2. Nakshatra (based on Moon's position)
    moon_sid_long = planets["Moon"]["sidereal"]
    nakspan = 13.333333333333334
    nak_idx = int(moon_sid_long // nakspan) % 27
    nak_name = NAKSHATRAS_LIST[nak_idx]
    nak_num = nak_idx + 1
    
    # 3. Tithi (Moon-Sun difference)
    diff = planets["Moon"]["sidereal"] - planets["Sun"]["sidereal"]
    if diff < 0:
        diff += 360.0
    tithi_num = int(diff // 12) + 1
    tithi_type = "Shukla Paksha" if tithi_num <= 15 else "Krishna Paksha"
    tithi_idx = tithi_num if tithi_num <= 15 else tithi_num - 15
    
    tithi_val = "Amavasya" if tithi_num == 30 else ("Purnima" if tithi_num == 15 else TITHI_NAMES[tithi_idx - 1])
    tithi_name = f"{tithi_type} {tithi_val}"
    
    # 4. Yoga (Sum of Sun and Moon longitude)
    yoga_sum = norm360(planets["Sun"]["sidereal"] + planets["Moon"]["sidereal"])
    yoga_idx = int(yoga_sum // nakspan) % 27
    yoga = YOGAS_LIST[yoga_idx]
    
    # 5. Karana (half of Tithi, spans 6 degrees)
    karana_num = int(diff // 6) + 1
    KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga", "Kintughna"]
    if karana_num == 1:
        karana = "Kintughna"
    elif karana_num >= 58:
        if karana_num == 58:
            karana = "Shakuni"
        elif karana_num == 59:
            karana = "Chatushpada"
        else:
            karana = "Naga"
    else:
        karana = KARANAS[(karana_num - 2) % 7]
        
    return {
        "date": date_obj.isoformat() + "Z",
        "dayOfWeek": day_of_week,
        "vara": vara,
        "nakshatraNum": nak_num,
        "nakshatraName": nak_name,
        "tithiNum": tithi_num,
        "tithiName": tithi_name,
        "yoga": yoga,
        "karana": karana
    }

def scan_muhurtas(event_type, start_calendar_date, lat, lon, tz_offset):
    # Parse start_calendar_date (format YYYY-MM-DD)
    start_dt = datetime.datetime.strptime(start_calendar_date.split("T")[0], "%Y-%m-%d")
    results = []
    
    # Scan next 90 days
    for i in range(90):
        scan_date = start_dt + datetime.timedelta(days=i)
        pan = calculate_day_panchanga(scan_date, lat, lon, tz_offset)
        
        score = 50  # Starting baseline
        reasons = []
        warnings = []
        
        # 1. Evaluate Vara (Day of Week)
        vara_weight = VARA_SUITABILITY.get(event_type, {}).get(pan["dayOfWeek"], 0.5)
        score += (vara_weight - 0.5) * 30  # Shift score by up to +/- 15 points
        if vara_weight >= 0.9:
            reasons.append(f"{pan['vara']} is an excellent day of the week for this event.")
        elif vara_weight <= 0.3:
            warnings.append(f"{pan['vara']} is generally considered inauspicious or weak for starting this event.")
            
        # 2. Evaluate Nakshatra
        is_nak_suitable = pan["nakshatraNum"] in SUITABLE_NAKSHATRAS.get(event_type, [])
        if is_nak_suitable:
            score += 25
            reasons.append(f"Nakshatra {pan['nakshatraName']} is highly compatible and auspicious for this action.")
        else:
            score -= 20
            warnings.append(f"Nakshatra {pan['nakshatraName']} is not classical or supportive for this activity.")
            
        # 3. Evaluate Tithi
        is_rikta = pan["tithiNum"] in RIKTA_TITHIS
        is_amavasya = (pan["tithiNum"] == 30)
        is_auspicious_tithi = (pan["tithiNum"] % 15 or 15) in [2, 3, 5, 7, 10, 11, 12, 13, 15]
        
        if is_rikta:
            score -= 25
            warnings.append(f"Avoided Rikta Tithi (empty day) of {pan['tithiName']}.")
        elif is_amavasya:
            score -= 30
            warnings.append("Amavasya (No Moon) is avoided for constructive, auspicious events.")
        elif is_auspicious_tithi:
            score += 15
            reasons.append(f"{pan['tithiName']} is a highly favorable and productive lunar phase.")
            
        # 4. Evaluate Yoga
        is_yoga_bad = pan["yoga"] in INAUSPICIOUS_YOGAS
        if is_yoga_bad:
            score -= 15
            warnings.append(f"Avoid inauspicious astrological combination: {pan['yoga']} Yoga.")
        else:
            score += 5
            
        # 5. Evaluate Karana
        is_karana_bad = pan["karana"] in INAUSPICIOUS_KARANAS
        if is_karana_bad:
            score -= 20
            warnings.append("Bhadra/Vishti Karana is active, which is avoided for starting auspicious tasks.")
        else:
            score += 5
            
        score = max(0, min(100, round(score)))
        
        suitability = "Average"
        if score >= 80:
            suitability = "Excellent (Highly Auspicious)"
        elif score >= 65:
            suitability = "Good (Favorable)"
        elif score < 45:
            suitability = "Unfavorable (Avoid)"
            
        results.append({
            "dateString": scan_date.strftime("%Y-%m-%d"),
            "panchanga": pan,
            "score": score,
            "suitability": suitability,
            "reasons": reasons,
            "warnings": warnings
        })
        
    # Sort by score descending (so best options appear first)
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
