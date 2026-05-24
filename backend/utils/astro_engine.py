import datetime
import math
import swisseph as swe

# Initialize swisseph sidereal mode to Lahiri
swe.set_sid_mode(swe.SIDM_LAHIRI)

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

NAKSHATRAS = [
    {"name": "Ashwini", "ruler": "Ketu"},
    {"name": "Bharani", "ruler": "Venus"},
    {"name": "Krittika", "ruler": "Sun"},
    {"name": "Rohini", "ruler": "Moon"},
    {"name": "Mrigashira", "ruler": "Mars"},
    {"name": "Ardra", "ruler": "Rahu"},
    {"name": "Punarvasu", "ruler": "Jupiter"},
    {"name": "Pushya", "ruler": "Saturn"},
    {"name": "Ashlesha", "ruler": "Mercury"},
    {"name": "Magha", "ruler": "Ketu"},
    {"name": "Purva Phalguni", "ruler": "Venus"},
    {"name": "Uttara Phalguni", "ruler": "Sun"},
    {"name": "Hasta", "ruler": "Moon"},
    {"name": "Chitra", "ruler": "Mars"},
    {"name": "Swati", "ruler": "Rahu"},
    {"name": "Vishakha", "ruler": "Jupiter"},
    {"name": "Anuradha", "ruler": "Saturn"},
    {"name": "Jyeshtha", "ruler": "Mercury"},
    {"name": "Mula", "ruler": "Ketu"},
    {"name": "Purva Ashadha", "ruler": "Venus"},
    {"name": "Uttara Ashadha", "ruler": "Sun"},
    {"name": "Shravana", "ruler": "Moon"},
    {"name": "Dhanishta", "ruler": "Mars"},
    {"name": "Shatabhisha", "ruler": "Rahu"},
    {"name": "Purva Bhadrapada", "ruler": "Jupiter"},
    {"name": "Uttara Bhadrapada", "ruler": "Saturn"},
    {"name": "Revati", "ruler": "Mercury"}
]

PLANET_MAP = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
    "Rahu": swe.MEAN_NODE,
}

DASHA_PERIODS = {
    "Ketu": 7,
    "Venus": 20,
    "Sun": 6,
    "Moon": 10,
    "Mars": 7,
    "Rahu": 18,
    "Jupiter": 16,
    "Saturn": 19,
    "Mercury": 17
}

DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]

def norm360(angle):
    a = angle % 360.0
    if a < 0:
        a += 360.0
    return a

def get_julian_day(year, month, day, hours, minutes, seconds, timezone_offset):
    # Convert local time to UTC using python datetime
    dt_local = datetime.datetime(year, month, day, hours, minutes, seconds)
    dt_utc = dt_local - datetime.timedelta(hours=timezone_offset)
    
    dec_hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dec_hour)
    return jd

def get_lahiri_ayanamsa(jd):
    return swe.get_ayanamsa(jd)

def calculate_planets(jd):
    ayanamsa = get_lahiri_ayanamsa(jd)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    
    planets = {}
    
    # Calculate Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu
    for p_name, p_id in PLANET_MAP.items():
        res, flags_ret, _ = swe.calc_ut(jd, p_id, flags)
        long_sid = res[0]
        # Swisseph calculates tropical by default unless FLG_SIDEREAL is set, 
        # so res[0] is already sidereal longitude in degrees!
        # Let's also compute the tropical position for completeness
        long_trop = norm360(long_sid + ayanamsa)
        planets[p_name] = {
            "tropical": long_trop,
            "sidereal": long_sid
        }
        
    # Ketu is exactly 180 degrees opposite to Rahu
    rahu_sid = planets["Rahu"]["sidereal"]
    ketu_sid = norm360(rahu_sid + 180.0)
    ketu_trop = norm360(ketu_sid + ayanamsa)
    planets["Ketu"] = {
        "tropical": ketu_trop,
        "sidereal": ketu_sid
    }
    
    return planets, ayanamsa

def calculate_lagna(jd, latitude, longitude):
    # Retrieve house cusps and ascendant/mc using swe.houses_ex
    # Use Equal House system (b'E') and pass FLG_SIDEREAL
    res = swe.houses_ex(jd, latitude, longitude, b'E', swe.FLG_SIDEREAL)
    # res[1] contains (ascendant, mc, armc, vertex, ...)
    lagna_sid = res[1][0]
    ayanamsa = get_lahiri_ayanamsa(jd)
    lagna_trop = norm360(lagna_sid + ayanamsa)
    
    return {
        "tropical": lagna_trop,
        "sidereal": lagna_sid
    }

def get_sign_details(long_deg):
    sign_num = int(long_deg // 30) % 12
    deg = long_deg % 30.0
    return {
        "signNum": sign_num,
        "signName": ZODIAC_SIGNS[sign_num],
        "deg": deg
    }

def get_nakshatra(long_deg):
    # A Nakshatra spans exactly 13°20' = 13.333333 degrees
    span = 13.333333333333334
    index = int(long_deg // span) % 27
    rem_deg = long_deg % span
    
    # Calculate Pada (Quarter) - spans 3°20' = 3.333333 degrees
    pada = int(rem_deg // 3.3333333333333335) + 1
    if pada > 4:
        pada = 4
        
    return {
        "nakshatraNum": index + 1,
        "name": NAKSHATRAS[index]["name"],
        "ruler": NAKSHATRAS[index]["ruler"],
        "pada": pada
    }

def get_planet_house(planet_long, lagna_long):
    p_sign = int(planet_long // 30) % 12
    l_sign = int(lagna_long // 30) % 12
    house = p_sign - l_sign + 1
    if house <= 0:
        house += 12
    return house

def get_houses(lagna_long):
    lagna_sign = int(lagna_long // 30) % 12
    houses = []
    for i in range(12):
        house_sign = (lagna_sign + i) % 12
        houses.append({
            "houseNum": i + 1,
            "signNum": house_sign,
            "signName": ZODIAC_SIGNS[house_sign]
        })
    return houses

def calculate_divisional_chart_sign(long_deg, lagna_deg, division):
    sign_num = int(long_deg // 30) % 12
    deg_in_sign = long_deg % 30.0
    varga_sign = 0
    
    if division == 1:  # D1 - Rashi
        varga_sign = sign_num
        
    elif division == 2:  # D2 - Hora
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        if is_odd:
            varga_sign = 4 if deg_in_sign < 15.0 else 3  # Leo or Cancer
        else:
            varga_sign = 3 if deg_in_sign < 15.0 else 4  # Cancer or Leo
            
    elif division == 3:  # D3 - Drekkana
        if deg_in_sign < 10.0:
            varga_sign = sign_num
        elif deg_in_sign < 20.0:
            varga_sign = (sign_num + 4) % 12
        else:
            varga_sign = (sign_num + 8) % 12
            
    elif division == 4:  # D4 - Chaturthamsa
        q4 = int(deg_in_sign // 7.5)
        varga_sign = (sign_num + q4 * 3) % 12
        
    elif division == 7:  # D7 - Saptamsa
        q7 = int(deg_in_sign // (30.0 / 7.0))
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        if is_odd:
            varga_sign = (sign_num + q7) % 12
        else:
            varga_sign = (sign_num + 6 + q7) % 12
            
    elif division == 9:  # D9 - Navamsa
        q9 = int(deg_in_sign // (30.0 / 9.0))
        s_type = sign_num % 4  # 0=Fiery, 1=Earthy, 2=Airy, 3=Watery
        if s_type == 0:
            start_sign = 0   # Aries
        elif s_type == 1:
            start_sign = 9   # Capricorn
        elif s_type == 2:
            start_sign = 6   # Libra
        else:
            start_sign = 3   # Cancer
        varga_sign = (start_sign + q9) % 12
        
    elif division == 10:  # D10 - Dasamsa
        q10 = int(deg_in_sign // 3.0)
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        if is_odd:
            varga_sign = (sign_num + q10) % 12
        else:
            varga_sign = (sign_num + 8 + q10) % 12
            
    elif division == 12:  # D12 - Dwadasamsa
        q12 = int(deg_in_sign // 2.5)
        varga_sign = (sign_num + q12) % 12
        
    elif division == 16:  # D16 - Shodasamsa
        q16 = int(deg_in_sign // 1.875)
        s_type = sign_num % 3  # 0=Moveable, 1=Fixed, 2=Dual
        if s_type == 0:
            start_sign = 0  # Aries
        elif s_type == 1:
            start_sign = 4  # Leo
        else:
            start_sign = 8  # Sagittarius
        varga_sign = (start_sign + q16) % 12
        
    elif division == 20:  # D20 - Vimsamsa
        q20 = int(deg_in_sign // 1.5)
        s_type = sign_num % 3
        if s_type == 0:
            start_sign = 0  # Aries
        elif s_type == 1:
            start_sign = 8  # Sagittarius
        else:
            start_sign = 4  # Leo
        varga_sign = (start_sign + q20) % 12
        
    elif division == 24:  # D24 - Chaturvimsamsa
        q24 = int(deg_in_sign // 1.25)
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        start_sign = 4 if is_odd else 3  # Leo or Cancer
        varga_sign = (start_sign + q24) % 12
        
    elif division == 27:  # D27 - Saptavimsamsa
        q27 = int(deg_in_sign // (30.0 / 27.0))
        s_type = sign_num % 4
        if s_type == 0:
            start_sign = 0  # Aries
        elif s_type == 1:
            start_sign = 3  # Cancer
        elif s_type == 2:
            start_sign = 6  # Libra
        else:
            start_sign = 9  # Capricorn
        varga_sign = (start_sign + q27) % 12
        
    elif division == 30:  # D30 - Trimsamsa
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        if is_odd:
            if deg_in_sign < 5.0:
                varga_sign = 0
            elif deg_in_sign < 10.0:
                varga_sign = 10
            elif deg_in_sign < 18.0:
                varga_sign = 8
            elif deg_in_sign < 25.0:
                varga_sign = 2
            else:
                varga_sign = 1
        else:
            if deg_in_sign < 5.0:
                varga_sign = 1
            elif deg_in_sign < 12.0:
                varga_sign = 2
            elif deg_in_sign < 20.0:
                varga_sign = 8
            elif deg_in_sign < 25.0:
                varga_sign = 10
            else:
                varga_sign = 0
                
    elif division == 40:  # D40 - Khavedamsa
        q40 = int(deg_in_sign // 0.75)
        vedic_sign = sign_num + 1
        is_odd = (vedic_sign % 2 != 0)
        start_sign = 0 if is_odd else 6  # Aries or Libra
        varga_sign = (start_sign + q40) % 12
        
    elif division == 45:  # D45 - Akshavedamsa
        q45 = int(deg_in_sign // (30.0 / 45.0))
        s_type = sign_num % 3
        if s_type == 0:
            start_sign = 0  # Aries
        elif s_type == 1:
            start_sign = 4  # Leo
        else:
            start_sign = 8  # Sagittarius
        varga_sign = (start_sign + q45) % 12
        
    elif division == 60:  # D60 - Shastiamsa
        q60 = int(deg_in_sign // 0.5)
        varga_sign = (sign_num + q60) % 12
        
    else:
        varga_sign = sign_num
        
    return varga_sign

def get_vimshottari_dasha(moon_sidereal, birth_date_obj):
    nakspan = 13.333333333333334
    nak_idx = int(moon_sidereal // nakspan) % 27
    rem_deg = moon_sidereal % nakspan
    
    starting_ruler = NAKSHATRAS[nak_idx]["ruler"]
    start_order_idx = DASHA_ORDER.index(startingRuler := starting_ruler)
    
    fraction_elapsed = rem_deg / nakspan
    total_ruler_years = DASHA_PERIODS[starting_ruler]
    dasha_balanced_years = total_ruler_years * (1.0 - fraction_elapsed)
    
    # Setup timeline starting from birth
    birth_timestamp = datetime.datetime(birth_date_obj.year, birth_date_obj.month, birth_date_obj.day)
    dasha_timeline = []
    
    # Calculate first balanced dasha
    balance_days = dasha_balanced_years * 365.25
    first_end_date = birth_timestamp + datetime.timedelta(days=balance_days)
    
    dasha_timeline.append({
        "planet": starting_ruler,
        "startDate": birth_timestamp.isoformat() + "Z",
        "endDate": first_end_date.isoformat() + "Z",
        "start_dt": birth_timestamp,
        "end_dt": first_end_date
    })
    
    # Complete 120-year cycle (the other 8 planets)
    order_idx = (start_order_idx + 1) % 9
    running_end_dt = first_end_date
    
    for _ in range(8):
        planet = DASHA_ORDER[order_idx]
        duration_years = DASHA_PERIODS[planet]
        prev_end_dt = running_end_dt
        running_end_dt = prev_end_dt + datetime.timedelta(days=duration_years * 365.25)
        
        dasha_timeline.append({
            "planet": planet,
            "startDate": prev_end_dt.isoformat() + "Z",
            "endDate": running_end_dt.isoformat() + "Z",
            "start_dt": prev_end_dt,
            "end_dt": running_end_dt
        })
        order_idx = (order_idx + 1) % 9
        
    # Calculate Antardashas
    for md in dasha_timeline:
        md_duration_days = (md["end_dt"] - md["start_dt"]).days
        md_planet = md["planet"]
        sub_start_order = DASHA_ORDER.index(md_planet)
        sub_running_dt = md["start_dt"]
        
        antardashas = []
        for k in range(9):
            sub_planet = DASHA_ORDER[(sub_start_order + k) % 9]
            sub_years = DASHA_PERIODS[sub_planet]
            # Fraction of Mahadasha = sub_years / 120
            sub_duration_days = md_duration_days * (sub_years / 120.0)
            sub_end_dt = sub_running_dt + datetime.timedelta(days=sub_duration_days)
            
            antardashas.append({
                "planet": sub_planet,
                "startDate": sub_running_dt.isoformat() + "Z",
                "endDate": sub_end_dt.isoformat() + "Z"
            })
            sub_running_dt = sub_end_dt
            
        md["antardashas"] = antardashas
        # Clean up datetime objects from output JSON
        del md["start_dt"]
        del md["end_dt"]
        
    return dasha_timeline

def generate_birth_chart_data(name, year, month, day, hours, minutes, seconds, lat, lon, timezone_offset, gender):
    jd = get_julian_day(year, month, day, hours, minutes, seconds, timezone_offset)
    planets, ayanamsa = calculate_planets(jd)
    lagna = calculate_lagna(jd, lat, lon)
    
    # Rashi placements (D1)
    rashi_placements = {
        "Lagna": {
            "name": "Lagna",
            "longitude": lagna["sidereal"],
            "signDetails": get_sign_details(lagna["sidereal"]),
            "nakshatra": get_nakshatra(lagna["sidereal"]),
            "house": 1
        }
    }
    
    for p_name, coords in planets.items():
        sid_long = coords["sidereal"]
        rashi_placements[p_name] = {
            "name": p_name,
            "longitude": sid_long,
            "signDetails": get_sign_details(sid_long),
            "nakshatra": get_nakshatra(sid_long),
            "house": get_planet_house(sid_long, lagna["sidereal"])
        }
        
    # Calculate 16 Shodashavargas
    vargas = [
        {"num": 1, "name": "D1 - Rashi (Lagna/Natal)"},
        {"num": 2, "name": "D2 - Hora (Wealth)"},
        {"num": 3, "name": "D3 - Drekkana (Siblings/Actions)"},
        {"num": 4, "name": "D4 - Chaturthamsa (Property/Luck)"},
        {"num": 7, "name": "D7 - Saptamsa (Children)"},
        {"num": 9, "name": "D9 - Navamsa (Spouse/Dharma)"},
        {"num": 10, "name": "D10 - Dasamsa (Career/Profession)"},
        {"num": 12, "name": "D12 - Dwadasamsa (Parents)"},
        {"num": 16, "name": "D16 - Shodasamsa (Vehicles/Comforts)"},
        {"num": 20, "name": "D20 - Vimsamsa (Spirituality/Progress)"},
        {"num": 24, "name": "D24 - Chaturvimsamsa (Education/Learning)"},
        {"num": 27, "name": "D27 - Saptavimsamsa (Strengths)"},
        {"num": 30, "name": "D30 - Trimsamsa (Miseries/Evil)"},
        {"num": 40, "name": "D40 - Khavedamsa (Auspicious Effects)"},
        {"num": 45, "name": "D45 - Akshavedamsa (Character/General Well-being)"},
        {"num": 60, "name": "D60 - Shastiamsa (Past Life/Karma)"}
    ]
    
    divisional_charts = {}
    for v in vargas:
        chart_placements = {}
        
        # Calculate lagna sign for this division
        l_sign = calculate_divisional_chart_sign(lagna["sidereal"], lagna["sidereal"], v["num"])
        chart_placements["Lagna"] = {
            "name": "Lagna",
            "signNum": l_sign,
            "signName": ZODIAC_SIGNS[l_sign]
        }
        
        for p_name, coords in planets.items():
            p_sign = calculate_divisional_chart_sign(coords["sidereal"], lagna["sidereal"], v["num"])
            # House relative to Lagna sign of this divisional chart
            house = p_sign - l_sign + 1
            if house <= 0:
                house += 12
            chart_placements[p_name] = {
                "name": p_name,
                "signNum": p_sign,
                "signName": ZODIAC_SIGNS[p_sign],
                "house": house
            }
            
        divisional_charts[str(v["num"])] = {
            "vargaId": v["num"],
            "name": v["name"],
            "placements": chart_placements
        }
        
    # Calculate Vimshottari Dashas
    birth_date = datetime.date(year, month, day)
    dashas = get_vimshottari_dasha(planets["Moon"]["sidereal"], birth_date)
    
    # Panchanga calculations
    # 1. Vara (Day of week)
    day_idx = datetime.date(year, month, day).weekday()
    # Python weekday is 0=Monday, 6=Sunday
    # Match standard VARAS: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    VARAS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    vara = VARAS[day_idx]
    
    # 2. Nakshatra
    moon_nak = get_nakshatra(planets["Moon"]["sidereal"])
    
    # 3. Tithi (lunar phase, spans 12 degrees)
    diff = planets["Moon"]["sidereal"] - planets["Sun"]["sidereal"]
    if diff < 0:
        diff += 360.0
    tithi_num = int(diff // 12) + 1
    tithi_type = "Shukla Paksha" if tithi_num <= 15 else "Krishna Paksha"
    tithi_idx = tithi_num if tithi_num <= 15 else tithi_num - 15
    
    TITHI_NAMES = [
        "Prathama (1)", "Dwitiya (2)", "Tritiya (3)", "Chaturthi (4)", "Panchami (5)", "Shasthi (6)",
        "Saptami (7)", "Ashtami (8)", "Navami (9)", "Dashami (10)", "Ekadashi (11)", "Dwadashi (12)",
        "Trayodashi (13)", "Chaturdashi (14)", "Purnima (15)"
    ]
    tithi_val = "Amavasya" if tithi_num == 30 else ("Purnima" if tithi_num == 15 else TITHI_NAMES[tithi_idx - 1])
    tithi = f"{tithi_type} {tithi_val}"
    
    # 4. Yoga (Sum of Sun and Moon longitude % 360, spans 13.333 degrees each)
    yoga_sum = norm360(planets["Sun"]["sidereal"] + planets["Moon"]["sidereal"])
    yoga_idx = int(yoga_sum // 13.333333333333334) % 27
    YOGAS_LIST = [
        "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
        "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
        "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
    ]
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
        
    panchanga = {
        "vara": vara,
        "nakshatra": moon_nak["name"],
        "tithi": tithi,
        "yoga": yoga,
        "karana": karana
    }
    
    return {
        "profile": {
            "name": name,
            "gender": gender,
            "date": f"{year}-{month:02d}-{day:02d}",
            "time": f"{hours:02d}:{minutes:02d}"
        },
        "julianDay": jd,
        "ayanamsa": ayanamsa,
        "rashiPlacements": rashi_placements,
        "divisionalCharts": divisional_charts,
        "dashas": dashas,
        "panchanga": panchanga
    }
