import datetime
from utils.astro_engine import generate_birth_chart_data

# Astrological Constants for Kundali Milan
ZODIAC_LORDS = {
    0: "Mars",      # Aries
    1: "Venus",     # Taurus
    2: "Mercury",   # Gemini
    3: "Moon",      # Cancer
    4: "Sun",       # Leo
    5: "Mercury",   # Virgo
    6: "Venus",     # Libra
    7: "Mars",      # Scorpio
    8: "Jupiter",   # Sagittarius
    9: "Saturn",    # Capricorn
    10: "Saturn",   # Aquarius
    11: "Jupiter"   # Pisces
}

PLANET_FRIENDSHIP = {
    "Sun": {"friends": ["Moon", "Mars", "Jupiter"], "enemies": ["Venus", "Saturn"], "neutrals": ["Mercury"]},
    "Moon": {"friends": ["Sun", "Mercury"], "enemies": [], "neutrals": ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]},
    "Mars": {"friends": ["Sun", "Moon", "Jupiter"], "enemies": ["Mercury"], "neutrals": ["Venus", "Saturn"]},
    "Mercury": {"friends": ["Sun", "Venus"], "enemies": ["Moon"], "neutrals": ["Mars", "Jupiter", "Saturn"]},
    "Jupiter": {"friends": ["Sun", "Moon", "Mars"], "enemies": ["Mercury", "Venus"], "neutrals": ["Saturn"]},
    "Venus": {"friends": ["Mercury", "Saturn"], "enemies": ["Sun", "Moon"], "neutrals": ["Mars", "Jupiter"]},
    "Saturn": {"friends": ["Mercury", "Venus"], "enemies": ["Sun", "Moon", "Mars"], "neutrals": ["Jupiter"]}
}

# 1. Varna: Brahmin (4), Kshatriya (3), Vaishya (2), Shudra (1)
VARNA_MAP = {
    3: 4, 7: 4, 11: 4,  # Cancer, Scorpio, Pisces -> Brahmin
    0: 3, 4: 3, 8: 3,   # Aries, Leo, Sagittarius -> Kshatriya
    1: 2, 5: 2, 9: 2,   # Taurus, Virgo, Capricorn -> Vaishya
    2: 1, 6: 1, 10: 1   # Gemini, Libra, Aquarius -> Shudra
}
VARNA_NAMES = {4: "Brahmin (Intellectual/Spiritual)", 3: "Kshatriya (Protector/Leader)", 2: "Vaishya (Commerce/Producer)", 1: "Shudra (Service/Worker)"}

# 2. Vashya: Manushya (1), Chatushpada (2), Jalachar (3), Vanachar (4), Keeta (5)
VASHYA_MAP = {
    0: 2, 1: 2,          # Aries, Taurus -> Quadruped
    2: 1,                # Gemini -> Human
    3: 3,                # Cancer -> Water-dwelling
    4: 4,                # Leo -> Wild/Beast
    5: 1,                # Virgo -> Human
    6: 1,                # Libra -> Human
    7: 5,                # Scorpio -> Insect
    8: 2,                # Sagittarius -> Quadruped (first half)
    9: 3,                # Capricorn -> Water-dwelling (first half)
    10: 1,               # Aquarius -> Human
    11: 3                # Pisces -> Water-dwelling
}
VASHYA_NAMES = {1: "Manushya (Human)", 2: "Chatushpada (Quadruped)", 3: "Jalachar (Water-dwelling)", 4: "Vanachar (Beast of Wild)", 5: "Keeta (Insect)"}

# 3. Tara classifications (rem % 9: 1=Janma, 2=Sampat, 3=Vipat, 4=Kshema, 5=Pratyari, 6=Sadhaka, 7=Vadha, 8=Mitra, 9=Atimitra)
# Remainder 3, 5, 7 are unfavorable

# 4. Yoni: 14 Animal Archetypes
YONI_MAP = {
    1: "Horse", 2: "Elephant", 3: "Sheep", 4: "Serpent", 5: "Dog", 6: "Cat", 7: "Rat",
    8: "Cow", 9: "Buffalo", 10: "Tiger", 11: "Hare", 12: "Monkey", 13: "Lion", 14: "Mongoose",
    15: " Serpant", 16: "Dog", 17: "Deer", 18: "Serpent", 19: "Sheep", 20: "Cat", 21: "Rat",
    22: "Monkey", 23: "Lion", 24: "Horse", 25: "Elephant", 26: "Cow", 27: "Mongoose"
}
# Fallback nakshatra to Yoni animal mapping:
NAK_YONIS = [
    "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cat", "Dog",
    "Rat", "Cat", "Cow", "Buffalo", "Tiger", "Tiger", "Hare", "Deer", "Deer",
    "Dog", "Monkey", "Monkey", "Lion", "Mongoose", "Lion", "Horse", "Elephant", "Cow"
]
YONI_NAMES = {
    "Horse": "Ashwa (Horse - Active/Sensual)",
    "Elephant": "Gaja (Elephant - Royal/Stable)",
    "Sheep": "Mesha (Sheep - Gentle/Social)",
    "Serpent": "Sarpa (Serpent - Deep/Intuitive)",
    "Dog": "Shvana (Dog - Loyal/Protective)",
    "Cat": "Marjara (Cat - Independent/Acrobatic)",
    "Rat": "Mushaka (Rat - Intelligent/Resourceful)",
    "Cow": "Go (Cow - Nurturing/Peaceful)",
    "Buffalo": "Mahisha (Buffalo - Strong/Patient)",
    "Tiger": "Vyaghras (Tiger - Proud/Passionate)",
    "Deer": "Mriga (Deer - Soft/Alert)",
    "Monkey": "Vanara (Monkey - Playful/Witty)",
    "Lion": "Simha (Lion - Noble/Commanding)",
    "Mongoose": "Nakula (Mongoose - Analytical/Individualistic)"
}

YONI_MATRIX = {
    # 4 = Perfect, 3 = Favorable, 2 = Neutral, 1 = Challenging, 0 = Hostile
    "Horse": {"Horse": 4, "Serpent": 1, "Tiger": 1, "Mongoose": 0, "Elephant": 2, "Sheep": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Elephant": {"Elephant": 4, "Lion": 0, "Horse": 2, "Serpent": 2, "Tiger": 2, "Mongoose": 2, "Sheep": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Deer": 2, "Monkey": 2},
    "Sheep": {"Sheep": 4, "Monkey": 0, "Horse": 2, "Elephant": 2, "Serpent": 2, "Tiger": 2, "Mongoose": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Deer": 2, "Lion": 2},
    "Serpent": {"Serpent": 4, "Mongoose": 0, "Horse": 1, "Elephant": 2, "Sheep": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Dog": {"Dog": 4, "Cat": 0, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Tiger": 2, "Mongoose": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Cat": {"Cat": 4, "Rat": 0, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 0, "Mongoose": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Rat": {"Rat": 4, "Cat": 0, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Mongoose": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Cow": {"Cow": 4, "Tiger": 0, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Buffalo": 3, "Mongoose": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Buffalo": {"Buffalo": 4, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 3, "Tiger": 2, "Mongoose": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Tiger": {"Tiger": 4, "Cow": 0, "Horse": 1, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Buffalo": 2, "Mongoose": 2, "Deer": 2, "Monkey": 2, "Lion": 2},
    "Deer": {"Deer": 4, "Horse": 2, "Elephant": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Mongoose": 2, "Monkey": 2, "Lion": 2},
    "Monkey": {"Monkey": 4, "Sheep": 0, "Horse": 2, "Elephant": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Mongoose": 2, "Deer": 2, "Lion": 2},
    "Lion": {"Lion": 4, "Elephant": 0, "Horse": 2, "Sheep": 2, "Serpent": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Mongoose": 2, "Deer": 2, "Monkey": 2},
    "Mongoose": {"Mongoose": 4, "Serpent": 0, "Horse": 0, "Elephant": 2, "Sheep": 2, "Dog": 2, "Cat": 2, "Rat": 2, "Cow": 2, "Buffalo": 2, "Tiger": 2, "Deer": 2, "Monkey": 2, "Lion": 2}
}

# 5. Gana: Deva (0), Manushya (1), Rakshasa (2)
GANA_MAP = {
    1: 0, 2: 0, 5: 0, 8: 0, 13: 0, 15: 0, 17: 0, 22: 0, 27: 0,      # Deva
    4: 1, 6: 1, 11: 1, 12: 1, 20: 1, 21: 1, 25: 1, 26: 1, 3: 1,      # Manushya
    3: 2, 7: 2, 9: 2, 10: 2, 14: 2, 16: 2, 18: 2, 19: 2, 23: 2, 24: 2 # Rakshasa
}
# Fallback map for Gana
NAK_GANAS = [
    "Deva", "Deva", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa",
    "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
    "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva"
]

# 6. Nadi: Adi (0), Madhya (1), Antya (2)
NAK_NADIS = [
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
    "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
    "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya"
]

def get_graha_friendship_score(lord1, lord2):
    if lord1 == lord2:
        return 5
        
    f1 = PLANET_FRIENDSHIP.get(lord1, {})
    f2 = PLANET_FRIENDSHIP.get(lord2, {})
    
    is_f1_friend = lord2 in f1.get("friends", [])
    is_f2_friend = lord1 in f2.get("friends", [])
    is_f1_enemy = lord2 in f1.get("enemies", [])
    is_f2_enemy = lord1 in f2.get("enemies", [])
    
    if is_f1_friend and is_f2_friend:
        return 5
    elif (is_f1_friend and not is_f2_enemy) or (is_f2_friend and not is_f1_enemy):
        return 4
    elif not is_f1_enemy and not is_f2_enemy:
        return 3
    elif (is_f1_enemy and not is_f2_enemy) or (is_f2_enemy and not is_f1_enemy):
        return 1
    else:
        return 0

def check_manglik(chart_data):
    # Check if Mars is in 1, 2, 4, 7, 8, or 12 house in D1
    mars_house = chart_data["rashiPlacements"]["Mars"]["house"]
    is_manglik = mars_house in [1, 2, 4, 7, 8, 12]
    reasons = f"Mars occupies the H{mars_house} house" if is_manglik else "Mars is placed in a protective house (H{mars_house})"
    return is_manglik, reasons

def calculate_kundali_milan(primary_chart, partner_chart):
    # 1. Retrieve Placements
    p_moon = primary_chart["rashiPlacements"]["Moon"]
    partner_moon = partner_chart["rashiPlacements"]["Moon"]
    
    p_nak = p_moon["nakshatra"]["nakshatraNum"] # 1-27
    partner_nak = partner_moon["nakshatra"]["nakshatraNum"]
    
    p_sign = p_moon["signDetails"]["signNum"] # 0-11
    partner_sign = partner_moon["signDetails"]["signNum"]
    
    p_lord = ZODIAC_LORDS[p_sign]
    partner_lord = ZODIAC_LORDS[partner_sign]
    
    # 2. Ashtakoota Scoring
    score_breakdown = {}
    total_score = 0
    warnings = []
    cancelations = []
    
    # --- Category 1: Varna (1 Point) ---
    p_varna = VARNA_MAP[p_sign]
    partner_varna = VARNA_MAP[partner_sign]
    # Boy is primary (traditional model is primary=boy, partner=girl or vice-versa, 
    # but classically Boy's varna grade must be >= Girl's varna grade for 1 point)
    # To keep it gender-neutral/supportive, we compare both and assign points if compatible
    # Classically: Primary's gender defines role. Let's assume Primary (Native) and Partner.
    # We will score 1 point if partner_varna <= p_varna, else 0 points.
    varna_score = 1 if partner_varna <= p_varna else 0
    score_breakdown["varna"] = {
        "title": "Varna (Spiritual/Ego Alignment)",
        "score": varna_score,
        "max": 1,
        "primary": VARNA_NAMES[p_varna],
        "partner": VARNA_NAMES[partner_varna],
        "status": "Compatible" if varna_score == 1 else "Challenging (Varna gap)"
    }
    total_score += varna_score
    
    # --- Category 2: Vashya (2 Points) ---
    p_vashya = VASHYA_MAP[p_sign]
    partner_vashya = VASHYA_MAP[partner_sign]
    # Classically, compatibility between groups:
    vashya_score = 0
    if p_vashya == partner_vashya:
        vashya_score = 2
    elif (p_vashya in [1, 2] and partner_vashya in [1, 2]) or (p_vashya in [3, 5] and partner_vashya in [3, 5]):
        vashya_score = 1
    
    score_breakdown["vashya"] = {
        "title": "Vashya (Dominance & Mutual Attraction)",
        "score": vashya_score,
        "max": 2,
        "primary": VASHYA_NAMES[p_vashya],
        "partner": VASHYA_NAMES[partner_vashya],
        "status": "Auspicious" if vashya_score == 2 else ("Neutral" if vashya_score == 1 else "Avoidance")
    }
    total_score += vashya_score
    
    # --- Category 3: Tara (3 Points) ---
    # Tara compatibility is based on distance between Nakshatras
    # Distance from Girl's Nak to Boy's Nak, and Boy's to Girl's
    dist_p_to_partner = (partner_nak - p_nak) % 9
    dist_partner_to_p = (p_nak - partner_nak) % 9
    
    if dist_p_to_partner == 0: dist_p_to_partner = 9
    if dist_partner_to_p == 0: dist_partner_to_p = 9
    
    p_tara_good = dist_p_to_partner not in [3, 5, 7]
    partner_tara_good = dist_partner_to_p not in [3, 5, 7]
    
    tara_score = 0
    if p_tara_good and partner_tara_good:
        tara_score = 3
    elif p_tara_good or partner_tara_good:
        tara_score = 1.5
        
    score_breakdown["tara"] = {
        "title": "Tara (Destiny & Health Alignment)",
        "score": tara_score,
        "max": 3,
        "primary": f"Tara remainder {dist_partner_to_p}",
        "partner": f"Tara remainder {dist_p_to_partner}",
        "status": "In harmony" if tara_score == 3 else ("Neutral alignment" if tara_score == 1.5 else "Inauspicious Tara cycle")
    }
    total_score += tara_score
    
    # --- Category 4: Yoni (4 Points) ---
    p_yoni = NAK_YONIS[p_nak - 1]
    partner_yoni = NAK_YONIS[partner_nak - 1]
    
    yoni_score = YONI_MATRIX.get(p_yoni, {}).get(partner_yoni, 2)
    score_breakdown["yoni"] = {
        "title": "Yoni (Physical & Sexual Compatibility)",
        "score": yoni_score,
        "max": 4,
        "primary": YONI_NAMES[p_yoni],
        "partner": YONI_NAMES[partner_yoni],
        "status": "Excellent Match" if yoni_score == 4 else ("Favorable" if yoni_score == 3 else ("Neutral" if yoni_score == 2 else ("Challenging" if yoni_score == 1 else "Hostile Yoni Alliance")))
    }
    total_score += yoni_score
    
    # --- Category 5: Graha Maitri (5 Points) ---
    graha_score = get_graha_friendship_score(p_lord, partner_lord)
    score_breakdown["grahaMitri"] = {
        "title": "Graha Maitri (Psychological Compatibility)",
        "score": graha_score,
        "max": 5,
        "primary": f"Moon Lord {p_lord}",
        "partner": f"Moon Lord {partner_lord}",
        "status": "Extremely Friendly" if graha_score == 5 else ("Supportive" if graha_score >= 3 else "Psychological mismatch")
    }
    total_score += graha_score
    
    # --- Category 6: Gana (6 Points) ---
    p_gana = NAK_GANAS[p_nak - 1]
    partner_gana = NAK_GANAS[partner_nak - 1]
    
    gana_score = 0
    if p_gana == partner_gana:
        gana_score = 6
    elif (p_gana == "Deva" and partner_gana == "Manushya") or (p_gana == "Manushya" and partner_gana == "Deva"):
        gana_score = 5
    elif (p_gana == "Deva" and partner_gana == "Rakshasa") or (p_gana == "Rakshasa" and partner_gana == "Deva"):
        gana_score = 1
        
    score_breakdown["gana"] = {
        "title": "Gana (Temperament & Energy Flow)",
        "score": gana_score,
        "max": 6,
        "primary": p_gana,
        "partner": partner_gana,
        "status": "Perfect alignment" if gana_score == 6 else ("Compatible" if gana_score == 5 else ("Neutral" if gana_score == 1 else "Conflict of Gana temperaments"))
    }
    total_score += gana_score
    
    # --- Category 7: Bhakoot (7 Points) ---
    # Relative sign distance (inclusive distance)
    diff_sign = (partner_sign - p_sign) % 12
    # Convert to 1-indexed relative positions (e.g. 1st, 2nd, ..., 12th)
    rel_pos1 = diff_sign + 1
    rel_pos2 = (12 - diff_sign) % 12 + 1
    
    bhakoot_score = 7
    bhakoot_dosha = False
    
    # Classically, 2-12, 6-8, and 9-5 relative placements cause Bhakoot Dosha (0 points)
    # (6-8 is Dwir-dwadash, 2-12 is Shaddashtak, 9-5 is Nava-panchama)
    # Wait, classically 2-12 and 6-8 are highly unfavorable. 5-9 can be neutral/minor dosha.
    # 7-7 (opposites) is excellent.
    if rel_pos1 in [2, 12, 6, 8, 5, 9]:
        # Bhakoot Dosha
        bhakoot_score = 0
        bhakoot_dosha = True
        
    # Bhakoot Dosha cancelation logic:
    # If Moon sign lords are friends, or have the same lord, Bhakoot Dosha is canceled!
    if bhakoot_dosha:
        if p_lord == partner_lord or get_graha_friendship_score(p_lord, partner_lord) >= 4:
            bhakoot_score = 7 # Restore score!
            bhakoot_dosha = False
            cancelations.append("Bhakoot Dosha is present but successfully canceled due to planetary friendship between Moon sign lords.")
            
    if bhakoot_dosha:
        warnings.append(f"Bhakoot Dosha (Emotional Conflict) is active due to relative {rel_pos1}-{rel_pos2} Moon sign placements.")
        
    score_breakdown["bhakoot"] = {
        "title": "Bhakoot (Relationship & Heart Stability)",
        "score": bhakoot_score,
        "max": 7,
        "primary": f"Sign index {p_sign + 1}",
        "partner": f"Sign index {partner_sign + 1}",
        "status": "Auspicious Bhakoot alliance" if bhakoot_score == 7 else "Bhakoot Dosha warning"
    }
    total_score += bhakoot_score
    
    # --- Category 8: Nadi (8 Points) ---
    p_nadi = NAK_NADIS[p_nak - 1]
    partner_nadi = NAK_NADIS[partner_nak - 1]
    
    nadi_score = 8
    nadi_dosha = False
    
    if p_nadi == partner_nadi:
        nadi_score = 0
        nadi_dosha = True
        
    # Nadi Dosha cancelation logic:
    # Canceled if they are born in same Nakshatra but different Padas, or have different Moon signs
    if nadi_dosha:
        if p_nak == partner_nak:
            # Different Padas
            p_pada = p_moon["nakshatra"]["pada"]
            partner_pada = partner_moon["nakshatra"]["pada"]
            if p_pada != partner_pada:
                nadi_score = 8
                nadi_dosha = False
                cancelations.append("Nadi Dosha is canceled because they share the same Nakshatra but occupy different quarters (Padas).")
        elif p_sign != partner_sign:
            # Different signs but same Nakshatra (spans across signs, e.g. Krittika)
            nadi_score = 8
            nadi_dosha = False
            cancelations.append("Nadi Dosha is canceled because the shared Nakshatra spans across different Moon signs.")
            
    if nadi_dosha:
        warnings.append(f"Nadi Dosha (Genetics/Physiological mismatch) is active since both share {p_nadi} Nadi. Classically avoided.")
        
    score_breakdown["nadi"] = {
        "title": "Nadi (Vigor, Genetics & Health Harmony)",
        "score": nadi_score,
        "max": 8,
        "primary": p_nadi,
        "partner": partner_nadi,
        "status": "In biological harmony" if nadi_score == 8 else "Nadi Dosha warning"
    }
    total_score += nadi_score
    
    # 3. Manglik Compatibility Check
    p_manglik, p_manglik_reason = check_manglik(primary_chart)
    partner_manglik, partner_manglik_reason = check_manglik(partner_chart)
    
    manglik_status = "Auspicious Compatibility"
    manglik_analysis = ""
    if p_manglik and partner_manglik:
        manglik_analysis = "Both charts carry Manglik Dosha. The matching presence neutralizes and cancels the Dosha completely, creating a highly stable and balanced energetic alliance."
        cancelations.append("Manglik Dosha canceled due to matching presence in both horoscopes.")
    elif not p_manglik and not partner_manglik:
        manglik_analysis = "Neither chart carries Manglik Dosha. This represents a calm, stable, and highly supportive emotional foundation with no Martian friction."
    else:
        manglik_status = "Frictional Compatibility"
        warnings.append("Partial Manglik friction: Only one partner carries Manglik Dosha. This can lead to minor emotional adjustments or friction.")
        manglik_analysis = f"Only one partner carries Manglik Dosha ({primary_chart['profile']['name'] if p_manglik else partner_chart['profile']['name']}). The other is non-Manglik. Classical adjustments or deep understanding of Mars' passionate cycles is suggested."
        
    # 4. Synthesize Compassionate Matchmaking Summary
    synthesis = compile_matchmaking_synthesis(total_score, score_breakdown, p_moon, partner_moon, p_gana, partner_gana, p_nadi, partner_nadi, p_manglik, partner_manglik, warnings, cancelations)
    
    return {
        "success": True,
        "score": total_score,
        "maxScore": 36,
        "scoreBreakdown": score_breakdown,
        "primaryPlacements": {
            "moonSign": p_moon["signDetails"]["signName"],
            "nakshatra": p_moon["nakshatra"]["name"],
            "pada": p_moon["nakshatra"]["pada"],
            "lord": p_lord,
            "isManglik": p_manglik,
            "manglikReason": p_manglik_reason
        },
        "partnerPlacements": {
            "moonSign": partner_moon["signDetails"]["signName"],
            "nakshatra": partner_moon["nakshatra"]["name"],
            "pada": partner_moon["nakshatra"]["pada"],
            "lord": partner_lord,
            "isManglik": partner_manglik,
            "manglikReason": partner_manglik_reason
        },
        "manglikCompatibility": {
            "status": manglik_status,
            "analysis": manglik_analysis
        },
        "warnings": warnings,
        "cancelations": cancelations,
        "aiSynthesis": synthesis
    }

def compile_matchmaking_synthesis(score, breakdown, p_moon, partner_moon, p_gana, partner_gana, p_nadi, partner_nadi, p_manglik, partner_manglik, warnings, cancelations):
    synthesis = "### 💍 Ashtakoota Milan Compatibility Analysis\n"
    synthesis += f"The ancient Vedic sages formulated the **Ashtakoota (8-Category) Matching system** to evaluate Moon sign and Nakshatra placements. "
    synthesis += f"Out of 36 maximum compatibility points, your score is **{score}/36**.\n\n"
    
    if score >= 28:
        synthesis += "> **💎 High-Fidelity Match (Excellent Compatibility):** This relationship demonstrates a rare and beautiful alignment of temperaments, biological rhythms, and heart energies. A highly recommended alliance for domestic happiness and mutual growth.\n\n"
    elif score >= 18:
        synthesis += "> **🟢 Auspicious Match (Favorable Compatibility):** Achieving a score above 18 points signifies a solid, stable, and auspicious Vedic match. With standard emotional understanding and mutual appreciation, this partnership will flourish beautifully.\n\n"
    else:
        synthesis += "> **⚠️ Challenging Match (Requires Compromise):** A score below 18 suggests that the planetary alignment presents several frictional nodes. Vedic wisdom reminds us that conscious action, free will, and mutual respect can overcome cosmic friction, but deep communication will be essential.\n\n"
        
    # Gana & Nadi insights
    synthesis += "### ⚡ Temperament & Physiological Resonance\n"
    synthesis += f"- **Temperament (Gana Milan):** The primary partner belongs to **{p_gana} Gana** and the partner belongs to **{partner_gana} Gana**. "
    if p_gana == partner_gana:
        synthesis += "Sharing the same Gana indicates an identical frequency of thought, leading to intuitive agreement and matching life expectations.\n"
    elif (p_gana == "Deva" and partner_gana == "Manushya") or (p_gana == "Manushya" and partner_gana == "Deva"):
        synthesis += "This combination forms a gentle and compatible blend of divine traits and practical human values.\n"
    else:
        synthesis += "This indicates a Gana mismatch, which classically represents differing expectations in daily lifestyle and decision-making styles. Cultivate deliberate patience with each other's intrinsic natures.\n"
        
    synthesis += f"- **Health & Biological Sync (Nadi Milan):** The primary partner possesses **{p_nadi} Nadi** and the partner possesses **{partner_nadi} Nadi**. "
    if p_nadi != partner_nadi:
        synthesis += "Differing Nadis yield a maximum of **8/8 points**, signifying that your biological elements are perfectly balanced and complement each other beautifully.\n"
    else:
        if len(cancelations) > 0 and any("Nadi" in c for c in cancelations):
            synthesis += "Although sharing the same Nadi classically creates Nadi Dosha, **the configuration contains a classic cancelation** (shared Nakshatra with different quarters/Moon signs). This restores the score and brings health harmony!\n"
        else:
            synthesis += "Sharing the same Nadi creates Nadi Dosha. In Vedic medicine, this represents matching biological constitutions (Vata, Pitta, or Kapha) which can lead to nervous sensitivity or health delays in children. Remedies include regular shared rest, healthy nutrition, and spiritual balance.\n"
            
    # Manglik insights
    synthesis += "\n### 🔥 Martian Alignment (Manglik Dosha Analysis)\n"
    if p_manglik and partner_manglik:
        synthesis += "Both partners exhibit Manglik Dosha in their natal charts. The matching presence of Mars' intense, passionate force in both horoscopes **successfully neutralizes and cancels** the Dosha. This forms a balanced, passionate, and energetic bond where both parties have matching levels of drive and focus.\n"
    elif not p_manglik and not partner_manglik:
        synthesis += "Neither partner is Manglik. This represents a calm, peaceful, and highly stable emotional alliance with low Martian friction and deep domestic peace.\n"
    else:
        synthesis += f"Only one partner is Manglik (Mars in H{breakdown['bhakoot']['score'] if p_manglik else breakdown['gana']['score']}). This partial Manglik friction can occasionally manifest as passionate disputes or adjustments. Practicing mutual space, letting anger cool down before talking, and avoiding ego battles will easily dissolve this friction.\n"
        
    # Remedies & Guidance
    synthesis += "\n### ✨ Compassionate Guidance & Vedic Remedies\n"
    synthesis += "Vedic astrology (Jyotish) acts as a cosmic roadmap, but it is **Kriyaman Karma (our conscious action today)** that ultimate writes our destiny. To expand and nurture this union, we suggest the following holistic guidelines:\n"
    
    if score < 20:
        synthesis += "1. **Regular Charity (Danam):** Selflessly supporting couples in need, donating clothes, or serving sweet food to birds activates the soothing energies of Venus and Moon, diluting Bhakoot and Gana frictions.\n"
    synthesis += "2. **Martian Pacification:** In cases of Mars friction, practice joint physical activities (Yoga, nature walks) and maintain emotional transparency. Respecting each other's need for personal space will turn fiery friction into passionate support.\n"
    synthesis += "3. **Shared Gratitude:** Nurture the relationship by maintaining a daily habit of mutual gratitude. A relationship is not a static alignment, but a dynamic spiritual path where two souls help each other realize their divine nature.\n\n"
    
    synthesis += "*May the cosmic elements bring mutual understanding, abundant grace, and peaceful companionship to your paths.*"
    
    return synthesis
