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

TRANSIT_INTERPRETATIONS = {
    "Sun": {
        1: "Sun transiting your 1st house lights up your personal focus, vitality, and self-confidence.",
        2: "Sun transiting your 2nd house highlights wealth, family speech patterns, and financial assets.",
        3: "Sun transiting your 3rd house sparks courage, self-efforts, and communication.",
        4: "Sun transiting your 4th house brings focus to home comforts, mother, and inner emotional peace.",
        5: "Sun transiting your 5th house stimulates creativity, intellect, children, and speculative opportunities.",
        6: "Sun transiting your 6th house offers victory over debt, health issues, and professional competitors.",
        7: "Sun transiting your 7th house highlights spouse dynamics, close friendships, and public relations.",
        8: "Sun transiting your 8th house signals deep research, transformation, and unexpected joint finances.",
        9: "Sun transiting your 9th house expands wisdom, luck, spiritual values, and mentorship.",
        10: "Sun transiting your 10th house creates high professional success, recognition, and leadership growth.",
        11: "Sun transiting your 11th house activates major professional cashflows, elder siblings support, and desires fulfilled.",
        12: "Sun transiting your 12th house suggests reflective isolation, dream insights, or spiritual expenses."
    },
    "Moon": {
        1: "Moon transiting your 1st house heightens emotional awareness, intuition, and sensitivity.",
        2: "Moon transiting your 2nd house brings fluctuating focus to savings, family comfort, and voice.",
        3: "Moon transiting your 3rd house supports sibling communication, creative writing, and local travels.",
        4: "Moon transiting your 4th house enhances domestic peace, nurturing, and emotional contentment.",
        5: "Moon transiting your 5th house lights up romantic ideas, intellectual learning, and children.",
        6: "Moon transiting your 6th house indicates high analytical focus, routine duties, and daily wellness habits.",
        7: "Moon transiting your 7th house brings focus to partnership connections, agreements, and social engagements.",
        8: "Moon transiting your 8th house suggests intense psychological research, deep reflection, and mystery.",
        9: "Moon transiting your 9th house encourages philosophical studies, luck activations, and moral pursuits.",
        10: "Moon transiting your 10th house creates visibility at work, public status, and career focus.",
        11: "Moon transiting your 11th house activates friendly networking, group circles, and financial rewards.",
        12: "Moon transiting your 12th house calls for rest, dream journaling, and deep spiritual retreat."
    },
    "Mars": {
        1: "Mars transiting your 1st house boosts physical energy, raw drive, courage, and pioneering action.",
        2: "Mars transiting your 2nd house demands directness and discipline in wealth building and speech.",
        3: "Mars transiting your 3rd house fills you with high courage, self-determination, and sibling initiatives.",
        4: "Mars transiting your 4th house urges physical repairs at home or active care for domestic peace.",
        5: "Mars transiting your 5th house energizes intellectual focus, competitive sports, and creative drives.",
        6: "Mars transiting your 6th house gives you the high-vitality firepower to crush professional hurdles, debts, and enemies.",
        7: "Mars transiting your 7th house triggers passion and dynamic interactions in partnerships.",
        8: "Mars transiting your 8th house calls for absolute honesty, safety, and managing joint investments.",
        9: "Mars transiting your 9th house inspires direct, adventurous exploration of spiritual philosophies.",
        10: "Mars transiting your 10th house ignites professional leadership, raw ambition, and high-performance execution.",
        11: "Mars transiting your 11th house aggressively drives the pursuit of cashflows, large networks, and goal achievements.",
        12: "Mars transiting your 12th house calls for channeling drive into silent charity, Yoga, or energy work."
    },
    "Mercury": {
        1: "Mercury transiting your 1st house sharpens intellect, communications, and logical expression.",
        2: "Mercury transiting your 2nd house supports financial accounting, speech writing, and profitable savings plans.",
        3: "Mercury transiting your 3rd house sparks busy networking, local travels, and short-story ideas.",
        4: "Mercury transiting your 4th house creates active discussions at home and study of real estate or comfort factors.",
        5: "Mercury transiting your 5th house inspires educational studies, writing, speculative analysis, and children's games.",
        6: "Mercury transiting your 6th house aids analytical problem solving, medical research, and routine organization.",
        7: "Mercury transiting your 7th house fosters smooth business negotiations, commercial transactions, and agreements.",
        8: "Mercury transiting your 8th house unlocks deep research, occult studies, and secret data investigations.",
        9: "Mercury transiting your 9th house encourages writing, university learning, and high philosophy studies.",
        10: "Mercury transiting your 10th house creates high professional communications, business meetings, and status announcements.",
        11: "Mercury transiting your 11th house activates networking with intellectual friends and commercial income channels.",
        12: "Mercury transiting your 12th house supports creative dream analysis, silent writing, or research behind the scenes."
    },
    "Jupiter": {
        1: "Jupiter transiting your 1st house brings cosmic protection, wisdom expansion, physical vitality, and overall luck.",
        2: "Jupiter transiting your 2nd house expands family blessings, speech grace, wealth assets, and overall savings.",
        3: "Jupiter transiting your 3rd house elevates your self-efforts, sibling relationships, and local communication.",
        4: "Jupiter transiting your 4th house expands emotional happiness, home comforts, property deals, and maternal blessings.",
        5: "Jupiter transiting your 5th house triggers powerful luck, romantic happiness, creative sparks, children, and intellectual growth.",
        6: "Jupiter transiting your 6th house offers medical healing, cosmic protection over debts, and success in service.",
        7: "Jupiter transiting your 7th house blesses marriage partners, harmonious legal agreements, and public popularity.",
        8: "Jupiter transiting your 8th house expands spiritual research, inner psychology transformation, and joint assets.",
        9: "Jupiter transiting your 9th house triggers profound luck, divine protection, high spiritual learning, and fortunate travels.",
        10: "Jupiter transiting your 10th house expands career opportunities, wisdom in leadership, and public recognition.",
        11: "Jupiter transiting your 11th house triggers major professional cashflows, wish fulfillments, and large, supportive networks.",
        12: "Jupiter transiting your 12th house expands dream insight, silent meditation, ashram visits, and spiritual release."
    },
    "Venus": {
        1: "Venus transiting your 1st house enhances personal charm, beauty, charisma, and romantic aura.",
        2: "Venus transiting your 2nd house brings rich foods, sweet speech, luxury assets, and financial ease.",
        3: "Venus transiting your 3rd house activates artistic writing, local pleasure trips, and sibling harmony.",
        4: "Venus transiting your 4th house expands home beauty, luxury vehicle purchases, and family joy.",
        5: "Venus transiting your 5th house brings romantic experiences, creative arts, and joyful play with children.",
        6: "Venus transiting your 6th house offers peace in service, dietary adjustments, and friendly work surroundings.",
        7: "Venus transiting your 7th house blesses romance, sweet marriage dynamics, legal transactions, and public grace.",
        8: "Venus transiting your 8th house brings deep secrets, mystery in relationships, and joint financial ease.",
        9: "Venus transiting your 9th house expands spiritual pleasure, lucky art travels, and higher learning.",
        10: "Venus transiting your 10th house creates high professional charm, artistic recognition, and creative career paths.",
        11: "Venus transiting your 11th house triggers luxury profits, joyful networking, and dynamic artistic social circles.",
        12: "Venus transiting your 12th house triggers luxurious vacations, spiritual retreats, and peaceful sleep."
    },
    "Saturn": {
        1: "Saturn transiting your 1st house demands strong physical discipline, deep patience, and maturity.",
        2: "Saturn transiting your 2nd house calls for strict financial budgeting, cautious investments, and serious speech.",
        3: "Saturn transiting your 3rd house grants quiet courage, persistent self-efforts, and writing discipline.",
        4: "Saturn transiting your 4th house requires responsibility in domestic life, property repairs, and emotional grounding.",
        5: "Saturn transiting your 5th house structures creative works, demands discipline in education, and focus on children.",
        6: "Saturn transiting your 6th house offers long-term resilience to completely conquer debts, disputes, and health hurdles.",
        7: "Saturn transiting your 7th house brings serious commitments and tests of endurance in partnerships.",
        8: "Saturn transiting your 8th house demands caution in joint investments, deep esoteric research, and structural changes.",
        9: "Saturn transiting your 9th house structures higher spiritual beliefs, requiring slow, mature philosophical learning.",
        10: "Saturn transiting your 10th house builds solid, long-term career foundations, requiring hard work and persistent service.",
        11: "Saturn transiting your 11th house slowly organizes main cashflow channels, building stable, mature social networks.",
        12: "Saturn transiting your 12th house calls for deep spiritual discipline, solitary meditation, and structural release."
    },
    "Rahu": {
        1: "Rahu transiting your 1st house creates intense self-ambition, innovative identity shifts, and desire to stand out.",
        2: "Rahu transiting your 2nd house fuels obsession with dynamic wealth building and unique speech dynamics.",
        3: "Rahu transiting your 3rd house boosts raw courage, bold communication shifts, and ambitious self-efforts.",
        4: "Rahu transiting your 4th house triggers a strong desire for modern home comforts, luxury, or relocations.",
        5: "Rahu transiting your 5th house fuels intense creativity, speculative ideas, and unique intellectual learning.",
        6: "Rahu transiting your 6th house gives you the bold, unconventional drive to completely outsmart enemies and obstacles.",
        7: "Rahu transiting your 7th house triggers unique, dynamic partnership interactions and public relations.",
        8: "Rahu transiting your 8th house sparks intense occult curiosity, joint asset obsession, and deep mystery.",
        9: "Rahu transiting your 9th house creates unconventional philosophical ideas and ambitious long-distance journeys.",
        10: "Rahu transiting your 10th house fuels relentless career ambition, professional status breakthroughs, and innovative authority.",
        11: "Rahu transiting your 11th house triggers sudden, massive cashflows, global networks, and wishes fulfilled.",
        12: "Rahu transiting your 12th house sparks deep spiritual curiosity, interest in foreign lands, or unique dream insights."
    },
    "Ketu": {
        1: "Ketu transiting your 1st house calls for detachment from ego, deep self-reflection, and inner meditation.",
        2: "Ketu transiting your 2nd house triggers detachment from material assets, simplifying lifestyle and speech.",
        3: "Ketu transiting your 3rd house grants deep, intuitive courage and detachment from short-term busywork.",
        4: "Ketu transiting your 4th house directs focus toward inner spiritual peace rather than material home comforts.",
        5: "Ketu transiting your 5th house sparks intuitive intellectual insights, spiritual studies, and creative detachment.",
        6: "Ketu transiting your 6th house indicates smooth, silent victory over routine worries, conflicts, and health issues.",
        7: "Ketu transiting your 7th house calls for spiritual maturity, selfless space, and detachment in close relationships.",
        8: "Ketu transiting your 8th house unlocks intense psychic intuition, sudden revelations, and metaphysical research.",
        9: "Ketu transiting your 9th house triggers deep connection to ancient wisdom, spiritual gurus, and religious release.",
        10: "Ketu transiting your 10th house calls for selfless service in profession, focusing on duty rather than personal praise.",
        11: "Ketu transiting your 11th house simplifies desire patterns, focusing on spiritual connections over cash gains.",
        12: "Ketu transiting your 12th house represents the peak transit of spiritual liberation, peaceful sleep, and ego release."
    }
}

def norm360(angle):
    a = angle % 360.0
    if a < 0:
        a += 360.0
    return a

def get_julian_day_utc(year, month, day, decimal_hour):
    jd = swe.julday(year, month, day, decimal_hour)
    return jd

def get_lahiri_ayanamsa(jd):
    return swe.get_ayanamsa(jd)

def calculate_transit_positions(jd):
    ayanamsa = get_lahiri_ayanamsa(jd)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL
    
    transits = {}
    
    # Calculate main planets
    for p_name, p_id in PLANET_MAP.items():
        res, _, _ = swe.calc_ut(jd, p_id, flags)
        long_sid = norm360(res[0])
        transits[p_name] = {
            "longitude": long_sid,
            "signDetails": get_transit_sign_details(long_sid),
            "nakshatra": get_transit_nakshatra(long_sid)
        }
        
    # Ketu is opposite to Rahu
    rahu_sid = transits["Rahu"]["longitude"]
    ketu_sid = norm360(rahu_sid + 180.0)
    transits["Ketu"] = {
        "longitude": ketu_sid,
        "signDetails": get_transit_sign_details(ketu_sid),
        "nakshatra": get_transit_nakshatra(ketu_sid)
    }
    
    return transits

def get_transit_sign_details(long_deg):
    sign_num = int(long_deg // 30) % 12
    deg = long_deg % 30.0
    return {
        "signNum": sign_num,
        "signName": ZODIAC_SIGNS[sign_num],
        "deg": deg
    }

def get_transit_nakshatra(long_deg):
    span = 13.333333333333334
    index = int(long_deg // span) % 27
    rem_deg = long_deg % span
    pada = int(rem_deg // 3.3333333333333335) + 1
    if pada > 4:
        pada = 4
    return {
        "name": NAKSHATRAS[index]["name"],
        "ruler": NAKSHATRAS[index]["ruler"],
        "pada": pada
    }

def calculate_transit_overlay(birth_lagna_longitude, transit_positions):
    overlay = {}
    birth_lagna_sign = int(birth_lagna_longitude // 30) % 12
    
    for p_name, p_data in transit_positions.items():
        t_longitude = p_data["longitude"]
        t_sign = int(t_longitude // 30) % 12
        
        # Calculate house relative to Lagna sign (1-indexed)
        house = t_sign - birth_lagna_sign + 1
        if house <= 0:
            house += 12
            
        overlay[p_name] = {
            "longitude": t_longitude,
            "signDetails": p_data["signDetails"],
            "nakshatra": p_data["nakshatra"],
            "house": house,
            "interpretation": TRANSIT_INTERPRETATIONS.get(p_name, {}).get(house, f"Transiting {p_name} resides in your {house} house.")
        }
        
    return overlay

def generate_three_level_dasha(moon_sidereal, birth_date_obj):
    """
    Generates full Vimshottari dasha down to the 3rd level (Pratyantardasha)
    for a 120-year span starting from birth.
    """
    nakspan = 13.333333333333334
    nak_idx = int(moon_sidereal // nakspan) % 27
    rem_deg = moon_sidereal % nakspan
    
    starting_ruler = NAKSHATRAS[nak_idx]["ruler"]
    start_order_idx = DASHA_ORDER.index(starting_ruler)
    
    fraction_elapsed = rem_deg / nakspan
    total_ruler_years = DASHA_PERIODS[starting_ruler]
    dasha_balanced_years = total_ruler_years * (1.0 - fraction_elapsed)
    
    birth_timestamp = datetime.datetime(birth_date_obj.year, birth_date_obj.month, birth_date_obj.day)
    dasha_timeline = []
    
    # First Mahadasha (balanced)
    balance_days = dasha_balanced_years * 365.2425
    first_end_date = birth_timestamp + datetime.timedelta(days=balance_days)
    
    dasha_timeline.append({
        "planet": starting_ruler,
        "startDate": birth_timestamp.isoformat() + "Z",
        "endDate": first_end_date.isoformat() + "Z",
        "start_dt": birth_timestamp,
        "end_dt": first_end_date
    })
    
    # Subsequent Mahadashas
    order_idx = (start_order_idx + 1) % 9
    running_end_dt = first_end_date
    
    for _ in range(8):
        planet = DASHA_ORDER[order_idx]
        duration_years = DASHA_PERIODS[planet]
        prev_end_dt = running_end_dt
        running_end_dt = prev_end_dt + datetime.timedelta(days=duration_years * 365.2425)
        
        dasha_timeline.append({
            "planet": planet,
            "startDate": prev_end_dt.isoformat() + "Z",
            "endDate": running_end_dt.isoformat() + "Z",
            "start_dt": prev_end_dt,
            "end_dt": running_end_dt
        })
        order_idx = (order_idx + 1) % 9
        
    # Calculate Antardashas (Level 2) and Pratyantardashas (Level 3)
    for md in dasha_timeline:
        md_duration_days = (md["end_dt"] - md["start_dt"]).days
        md_planet = md["planet"]
        sub_start_order = DASHA_ORDER.index(md_planet)
        sub_running_dt = md["start_dt"]
        
        antardashas = []
        for k in range(9):
            ad_planet = DASHA_ORDER[(sub_start_order + k) % 9]
            ad_years = DASHA_PERIODS[ad_planet]
            # Fraction of Mahadasha = ad_years / 120
            ad_duration_days = md_duration_days * (ad_years / 120.0)
            ad_end_dt = sub_running_dt + datetime.timedelta(days=ad_duration_days)
            
            # Now calculate Pratyantardashas (Level 3) for this Antardasha
            pd_start_order = DASHA_ORDER.index(ad_planet)
            pd_running_dt = sub_running_dt
            pd_duration_total_days = ad_duration_days
            
            pratyantardashas = []
            for j in range(9):
                pd_planet = DASHA_ORDER[(pd_start_order + j) % 9]
                pd_years = DASHA_PERIODS[pd_planet]
                # Fraction of Antardasha = pd_years / 120
                pd_duration_days = pd_duration_total_days * (pd_years / 120.0)
                pd_end_dt = pd_running_dt + datetime.timedelta(days=pd_duration_days)
                
                pratyantardashas.append({
                    "planet": pd_planet,
                    "startDate": pd_running_dt.isoformat() + "Z",
                    "endDate": pd_end_dt.isoformat() + "Z"
                })
                pd_running_dt = pd_end_dt
                
            antardashas.append({
                "planet": ad_planet,
                "startDate": sub_running_dt.isoformat() + "Z",
                "endDate": ad_end_dt.isoformat() + "Z",
                "pratyantardashas": pratyantardashas
            })
            sub_running_dt = ad_end_dt
            
        md["antardashas"] = antardashas
        del md["start_dt"]
        del md["end_dt"]
        
    return dasha_timeline

def filter_timeline_by_zoom(dashas, start_date_str, years_span):
    """
    Filters and returns dasha segments in a specific time window.
    For short spans (e.g. 1 year), returns Pratyantardasha details as the zoom tier.
    For longer spans (e.g. 5-10 years), returns Antardashas.
    """
    start_dt = datetime.datetime.fromisoformat(start_date_str.replace("Z", ""))
    end_dt = start_dt + datetime.timedelta(days=years_span * 365.2425)
    
    flat_periods = []
    
    for md in dashas:
        md_planet = md["planet"]
        md_start = datetime.datetime.fromisoformat(md["startDate"].replace("Z", ""))
        md_end = datetime.datetime.fromisoformat(md["endDate"].replace("Z", ""))
        
        # Check Mahadasha overlap
        if md_end >= start_dt and md_start <= end_dt:
            for ad in md.get("antardashas", []):
                ad_planet = ad["planet"]
                ad_start = datetime.datetime.fromisoformat(ad["startDate"].replace("Z", ""))
                ad_end = datetime.datetime.fromisoformat(ad["endDate"].replace("Z", ""))
                
                if ad_end >= start_dt and ad_start <= end_dt:
                    if years_span <= 1:
                        # 1-year zoom: Return Pratyantardashas (PD)
                        for pd in ad.get("pratyantardashas", []):
                            pd_planet = pd["planet"]
                            pd_start = datetime.datetime.fromisoformat(pd["startDate"].replace("Z", ""))
                            pd_end = datetime.datetime.fromisoformat(pd["endDate"].replace("Z", ""))
                            
                            if pd_end >= start_dt and pd_start <= end_dt:
                                flat_periods.append({
                                    "tier": "PD",
                                    "mahadasha": md_planet,
                                    "antardasha": ad_planet,
                                    "pratyantardasha": pd_planet,
                                    "label": f"{md_planet}-{ad_planet}-{pd_planet}",
                                    "startDate": pd["startDate"],
                                    "endDate": pd["endDate"]
                                })
                    else:
                        # 5-10 year zoom: Return Antardashas (AD)
                        flat_periods.append({
                            "tier": "AD",
                            "mahadasha": md_planet,
                            "antardasha": ad_planet,
                            "label": f"{md_planet}-{ad_planet}",
                            "startDate": ad["startDate"],
                            "endDate": ad["endDate"]
                        })
                        
    return flat_periods
