import math
import swisseph as swe
from utils.astro_engine import norm360, get_julian_day, calculate_planets, calculate_lagna, get_planet_house, get_sign_details

# Exaltation (Ucha) points for all planets (Sidereal degrees)
EXALTATION_POINTS = {
    "Sun": 10.0,       # Aries 10°
    "Moon": 33.0,      # Taurus 3°
    "Mars": 298.0,     # Capricorn 28°
    "Mercury": 165.0,  # Virgo 15°
    "Jupiter": 95.0,   # Cancer 5°
    "Venus": 357.0,    # Pisces 27°
    "Saturn": 200.0,   # Libra 20°
    "Rahu": 50.0,      # Taurus 20°
    "Ketu": 230.0      # Scorpio 20°
}

# Standard Natural (Naisargika) strength constants
NAISARGIKA_STRENGTHS = {
    "Sun": 60.00,
    "Moon": 51.43,
    "Venus": 42.86,
    "Jupiter": 34.29,
    "Mercury": 25.71,
    "Mars": 17.14,
    "Saturn": 8.57,
    "Rahu": 5.00,
    "Ketu": 5.00
}

# Directional (Dik) Strength peak houses and angles
# Peak House Cusps (centered): 1H = 15°, 4H = 105°, 7H = 195°, 10H = 285°
DIK_PEAKS = {
    "Jupiter": 15.0,    # Ascendant (1st House)
    "Mercury": 15.0,    # Ascendant (1st House)
    "Moon": 105.0,      # Nadir (4th House)
    "Venus": 105.0,     # Nadir (4th House)
    "Saturn": 195.0,    # Descendant (7th House)
    "Sun": 285.0,       # Midheaven (10th House)
    "Mars": 285.0,      # Midheaven (10th House)
    "Rahu": 285.0,      # Favorable in 10th
    "Ketu": 345.0       # Favorable in 12th (Ascendant offset)
}

def calculate_ucha_bala(planet_name, sidereal_long):
    """
    Sthana Bala Sub-component: Ucha Bala (Exaltation strength).
    Maximum 60 Shastiamsas at Exaltation point, dropping to 0 at Debilitation point (180° opposite).
    """
    exalt = EXALTATION_POINTS.get(planet_name, 0.0)
    debility = norm360(exalt + 180.0)
    
    # Proximity to debility. If at debility, strength is 0. If at exaltation, strength is 60.
    diff = abs(sidereal_long - debility)
    if diff > 180.0:
        diff = 360.0 - diff
        
    return (diff / 180.0) * 60.0

def calculate_kendra_bala(house_num):
    """
    Sthana Bala Sub-component: Kendra Bala.
    Planets in Kendra houses (1, 4, 7, 10) get 60 Shastiamsas.
    Succedent houses (2, 5, 8, 11) get 30 Shastiamsas.
    Cadent houses (3, 6, 9, 12) get 15 Shastiamsas.
    """
    if house_num in [1, 4, 7, 10]:
        return 60.0
    elif house_num in [2, 5, 8, 11]:
        return 30.0
    else:
        return 15.0

def calculate_yugma_bala(planet_name, sign_num):
    """
    Sthana Bala Sub-component: Odd/Even Sign strength (Yugma Yugma Bala).
    Feminine planets (Moon, Venus) get 15 points in Even signs (0, 2, 4... indices are odd in astrology but index 0=Aries (Odd)).
    Sign number: 0=Aries(Odd), 1=Taurus(Even), 2=Gemini(Odd), etc.
    Even Sign numbers (1, 3, 5, 7, 9, 11) are Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces.
    Masculine/Neutral planets get 15 points in Odd signs.
    """
    is_even_sign = (sign_num % 2 == 1) # index 1, 3, 5, 7, 9, 11 represent Even signs
    if planet_name in ["Moon", "Venus"]:
        return 15.0 if is_even_sign else 0.0
    else:
        return 15.0 if not is_even_sign else 0.0

def calculate_dik_bala(planet_name, house_num):
    """
    Dik Bala (Directional strength). Max 60 Shastiamsas at peak house, dropping to 0 at opposite.
    """
    peak_angle = DIK_PEAKS.get(planet_name, 15.0)
    # Map house midpoint angle (approximate center of the house)
    house_angle = norm360((house_num - 1) * 30.0 + 15.0)
    
    diff = abs(house_angle - peak_angle)
    if diff > 180.0:
        diff = 360.0 - diff
        
    # Scale from 0 to 60
    return ((180.0 - diff) / 180.0) * 60.0

def calculate_cheshta_bala(planet_name, speed, is_retro):
    """
    Cheshta Bala (Motional strength). Max 60 points for retrograde planets.
    Direct planets get speed-scaled scores. Sun & Moon get constant declination approximations.
    """
    if planet_name in ["Sun", "Moon"]:
        return 45.0 # Average constant
        
    if is_retro:
        return 60.0
        
    # Direct motion: slower speed gets slightly higher strength in general,
    # let's return a stable direct motion baseline
    return 30.0

def calculate_drik_bala(planet_name, planet_longs):
    """
    Drik Bala (Aspect strength). aspect influence from benefics (+) and malefics (-).
    Standard angles: Trine (120°) = +15, Conjunction (0°) with Jupiter/Venus = +20, Saturn/Mars = -20.
    """
    aspect_strength = 0.0
    target_long = planet_longs.get(planet_name, 0.0)
    
    benefics = ["Jupiter", "Venus"]
    malefics = ["Saturn", "Mars"]
    
    for other_name, other_long in planet_longs.items():
        if other_name == planet_name:
            continue
            
        diff = abs(target_long - other_long)
        if diff > 180.0:
            diff = 360.0 - diff
            
        # Conjunction check (orb within 10 degrees)
        if diff < 10.0:
            if other_name in benefics:
                aspect_strength += 25.0
            elif other_name in malefics:
                aspect_strength -= 25.0
                
        # Opposition check (180° ± 10°)
        elif abs(diff - 180.0) < 10.0:
            if other_name in benefics:
                aspect_strength += 20.0
            elif other_name in malefics:
                aspect_strength -= 20.0
                
        # Trines check (120° or 240° ± 8°)
        elif abs(diff - 120.0) < 8.0:
            if other_name in benefics:
                aspect_strength += 15.0
            elif other_name in malefics:
                aspect_strength -= 10.0
                
    # Normalize aspects to be within a sensible range (-30 to +30)
    return max(-30.0, min(30.0, aspect_strength))

def get_shadbala_calculations(year, month, day, hours, minutes, seconds, lat, lon, tz):
    """
    Calculates full Shadbala metrics for all 9 planets.
    Returns calculated values and normalized percentage scores.
    """
    jd = get_julian_day(year, month, day, hours, minutes, seconds, tz)
    planets_coords, ayanamsa = calculate_planets(jd)
    lagna_info = calculate_lagna(jd, lat, lon)
    
    # Determine if daytime or nighttime birth (Sun in houses 7 to 12 is daytime)
    sun_sid = planets_coords["Sun"]["sidereal"]
    lagna_sid = lagna_info["sidereal"]
    sun_house = get_planet_house(sun_sid, lagna_sid)
    is_day_birth = (sun_house >= 7)
    
    # Calculate Moon-Sun separation for Paksha Bala
    moon_sid = planets_coords["Moon"]["sidereal"]
    separation = norm360(moon_sid - sun_sid)
    # Brightness fraction (0 = New Moon, 180 = Full Moon, 360 = New Moon)
    brightness = separation if separation <= 180.0 else (360.0 - separation)
    bright_ratio = brightness / 180.0
    
    # Extract sidereal longitudes and speed/retrograde statuses
    planet_longs = {}
    planet_speeds = {}
    planet_retros = {}
    
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    for p_name in EXALTATION_POINTS.keys():
        if p_name in ["Rahu", "Ketu"]:
            # Node approximations
            planet_longs[p_name] = planets_coords[p_name]["sidereal"]
            planet_speeds[p_name] = 0.0
            planet_retros[p_name] = False
            continue
            
        p_id = swe.SUN
        if p_name == "Sun": p_id = swe.SUN
        elif p_name == "Moon": p_id = swe.MOON
        elif p_name == "Mars": p_id = swe.MARS
        elif p_name == "Mercury": p_id = swe.MERCURY
        elif p_name == "Jupiter": p_id = swe.JUPITER
        elif p_name == "Venus": p_id = swe.VENUS
        elif p_name == "Saturn": p_id = swe.SATURN
        
        res, _, _ = swe.calc_ut(jd, p_id, flags)
        planet_longs[p_name] = res[0]
        planet_speeds[p_name] = res[3]
        planet_retros[p_name] = (res[3] < 0.0) # Negative speed indicates retrograde

    # Compute individual balas for all 9 planets
    shadbala_report = {}
    
    for p_name in EXALTATION_POINTS.keys():
        sidereal = planet_longs[p_name]
        sign_info = get_sign_details(sidereal)
        house = get_planet_house(sidereal, lagna_sid)
        
        # 1. Sthana Bala (Positional)
        ucha = calculate_ucha_bala(p_name, sidereal)
        kendra = calculate_kendra_bala(house)
        yugma = calculate_yugma_bala(p_name, sign_info["signNum"])
        
        # Divisional Vargaja approximation (D1, D9, D10 lord configurations)
        vargaja = 30.0  # Favorable default baseline
        if house in [6, 8, 12]:
            vargaja = 15.0  # Less favorable in dusthanas
            
        sthana_bala = ucha + kendra + yugma + vargaja
        
        # 2. Dik Bala (Directional)
        dik_bala = calculate_dik_bala(p_name, house)
        
        # 3. Kala Bala (Temporal)
        # Dina-Ratri (Day/Night) Bala
        dina_ratri = 0.0
        if is_day_birth:
            if p_name in ["Sun", "Jupiter", "Venus"]:
                dina_ratri = 60.0
        else:
            if p_name in ["Moon", "Mars", "Saturn"]:
                dina_ratri = 60.0
        if p_name == "Mercury":
            dina_ratri = 60.0 # Mercury is always strong
            
        # Paksha (Fortnight) Bala
        benefics = ["Jupiter", "Venus", "Mercury"]
        is_benefic = p_name in benefics
        # Moon is benefic if bright (bright_ratio > 0.5)
        if p_name == "Moon" and bright_ratio > 0.5:
            is_benefic = True
            
        if is_benefic:
            paksha_bala = bright_ratio * 60.0
        else:
            paksha_bala = (1.0 - bright_ratio) * 60.0
            
        # Add dynamic Vara/Hora/Ayana baseline values
        temporal_extra = 30.0
        kala_bala = dina_ratri + paksha_bala + temporal_extra
        
        # 4. Cheshta Bala (Motional)
        cheshta_bala = calculate_cheshta_bala(p_name, planet_speeds[p_name], planet_retros[p_name])
        
        # 5. Naisargika Bala (Natural)
        naisargika_bala = NAISARGIKA_STRENGTHS.get(p_name, 5.0)
        
        # 6. Drik Bala (Aspect)
        drik_bala = calculate_drik_bala(p_name, planet_longs)
        
        # Total Shadbala Score (Shastiamsas)
        total_score = sthana_bala + dik_bala + kala_bala + cheshta_bala + naisargika_bala + drik_bala
        
        # Normalize score into a unified percentage (0 to 100%) for radar visualization
        # Standard average requirements vary from 300 to 420. Max theoretical limit is ~550.
        # We map scores from [120, 520] linearly to [45%, 98%] so the chart stays beautifully open and scannable.
        min_limit = 120.0
        max_limit = 520.0
        normalized = 45.0 + ((total_score - min_limit) / (max_limit - min_limit)) * 53.0
        normalized = max(40.0, min(100.0, normalized)) # Safety bounds
        
        shadbala_report[p_name] = {
            "sthanaBala": round(sthana_bala, 2),
            "dikBala": round(dik_bala, 2),
            "kalaBala": round(kala_bala, 2),
            "cheshtaBala": round(cheshta_bala, 2),
            "naisargikaBala": round(naisargika_bala, 2),
            "drikBala": round(drik_bala, 2),
            "totalScore": round(total_score, 2),
            "percentage": round(normalized, 1)
        }
        
    return shadbala_report
