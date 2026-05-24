import datetime
import random
from utils.ingestion_engine import load_knowledge_base

PLANET_NAMES = {
    "Sun": "Sun (Soul, Authority, Life Force)",
    "Moon": "Moon (Mind, Emotion, Nurturing)",
    "Mars": "Mars (Energy, Courage, Action)",
    "Mercury": "Mercury (Intellect, Speech, Commerce)",
    "Jupiter": "Jupiter (Wisdom, Grace, Expansion)",
    "Venus": "Venus (Love, Luxury, Arts)",
    "Saturn": "Saturn (Discipline, Karma, Longevity)",
    "Rahu": "Rahu (Ambition, Innovation, Obsession)",
    "Ketu": "Ketu (Spirituality, Liberation, Intuition)"
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

def detect_yogas(chart_data):
    yogas = []
    rashi = chart_data["rashiPlacements"]
    
    # 1. Budhaditya Yoga (Sun and Mercury conjunct in same sign)
    if "Sun" in rashi and "Mercury" in rashi:
        if rashi["Sun"]["signDetails"]["signNum"] == rashi["Mercury"]["signDetails"]["signNum"]:
            yogas.append({
                "id": "Budhaditya_Yoga",
                "name": "Budhaditya Yoga",
                "description": "Formed by the conjunction of Sun and Mercury. It indicates exceptional intelligence, sharp analytical skills, excellent communication, and recognition in professional and academic circles."
            })
            
    # 2. Gaja Kesari Yoga (Jupiter in an angle (1, 4, 7, 10 house) from Moon)
    if "Moon" in rashi and "Jupiter" in rashi:
        moon_house = rashi["Moon"]["house"]
        jup_house = rashi["Jupiter"]["house"]
        diff = jup_house - moon_house + 1
        if diff <= 0:
            diff += 12
        if diff in [1, 4, 7, 10]:
            yogas.append({
                "id": "Gaja_Kesari_Yoga",
                "name": "Gaja Kesari Yoga",
                "description": "Formed when Jupiter is in an angular house from the Moon. It brings profound wisdom, wealth, leadership opportunities, high status, protection from adversaries, and stable long-term success."
            })
            
    # 3. Chandra Mangala Yoga (Moon and Mars conjunct in same sign)
    if "Moon" in rashi and "Mars" in rashi:
        if rashi["Moon"]["signDetails"]["signNum"] == rashi["Mars"]["signDetails"]["signNum"]:
            yogas.append({
                "id": "Chandra_Mangala_Yoga",
                "name": "Chandra Mangala Yoga",
                "description": "Formed by the conjunction of Moon and Mars. It represents a powerful business mind, relentless earning capacity, success in lands or real estate, and a competitive drive for financial growth."
            })
            
    return yogas

def get_current_dasha(dashas, date_obj=None):
    if date_obj is None:
        date_obj = datetime.datetime.utcnow()
        
    # Ensure date_obj is a datetime
    if isinstance(date_obj, datetime.date) and not isinstance(date_obj, datetime.datetime):
        date_obj = datetime.datetime(date_obj.year, date_obj.month, date_obj.day)
        
    def parse_iso(dt_str):
        cleaned = dt_str.replace("Z", "")
        return datetime.datetime.fromisoformat(cleaned)
        
    current_md = None
    for md in dashas:
        start_dt = parse_iso(md["startDate"])
        end_dt = parse_iso(md["endDate"])
        if start_dt <= date_obj <= end_dt:
            current_md = md
            break
            
    if not current_md:
        return {"mahadasha": "Unknown", "antardasha": "Unknown", "mdEnd": "", "adEnd": ""}
        
    current_ad = None
    for ad in current_md.get("antardashas", []):
        start_dt = parse_iso(ad["startDate"])
        end_dt = parse_iso(ad["endDate"])
        if start_dt <= date_obj <= end_dt:
            current_ad = ad
            break
            
    return {
        "mahadasha": current_md["planet"],
        "antardasha": current_ad["planet"] if current_ad else "Unknown",
        "mdEnd": current_md["endDate"].split("T")[0],
        "adEnd": current_ad["endDate"].split("T")[0] if current_ad else ""
    }

def get_house_sign(chart_data, house_num):
    lagna_sign_num = int(chart_data["rashiPlacements"]["Lagna"]["longitude"] // 30) % 12
    house_sign_num = (lagna_sign_num + house_num - 1) % 12
    return ZODIAC_SIGNS[house_sign_num]

def generate_predictions(chart_data):
    kb = load_knowledge_base()
    yogas = detect_yogas(chart_data)
    current_dasha = get_current_dasha(chart_data["dashas"])
    rashi = chart_data["rashiPlacements"]
    divisions = chart_data["divisionalCharts"]
    
    def get_rule(category, key):
        rules = kb.get(category, {}).get(key, [])
        if rules:
            return random.choice(rules)
        return None
        
    predictions = {}
    
    # ==================== 1. EDUCATION (5th House, D24, Mercury/Jupiter) ====================
    edu_text = ""
    edu_house_sign = get_house_sign(chart_data, 5)
    mercury_house = rashi["Mercury"]["house"]
    mercury_sign = rashi["Mercury"]["signDetails"]["signName"]
    mercury_varga = divisions["24"]["placements"]["Mercury"]
    mercury_varga_house = mercury_varga["house"]
    
    mercury_house_rule = get_rule("planets_in_houses", f"Mercury_{mercury_house}")
    jup5_rule = get_rule("planets_in_houses", "Jupiter_5") if rashi.get("Jupiter", {}).get("house") == 5 else None
    merc5_rule = get_rule("planets_in_houses", "Mercury_5") if rashi.get("Mercury", {}).get("house") == 5 else None
    
    edu_text += f"Your academic and intellectual potential is governed by the 5th House of your Natal chart, which falls in the sign of **{edu_house_sign}**. "
    edu_text += f"Mercury, the planet of intellect, is placed in your **{mercury_house} house** in the sign of **{mercury_sign}**. "
    
    if merc5_rule:
        edu_text += f"\n\n**Classical Theory on your placement:** {merc5_rule}\n\n"
    elif mercury_house_rule:
        edu_text += f"\n\n**Signification of Mercury Placement:** {mercury_house_rule}\n\n"
        
    if jup5_rule:
        edu_text += f"Jupiter (the grand preceptor) is placed in your 5th house: {jup5_rule} "
        
    edu_text += f"In your **D24 Chaturvimsamsa Chart** (governing education and skill acquisition), Mercury is situated in the **{mercury_varga_house} house** in **{mercury_varga['signName']}**. "
    if mercury_varga_house in [1, 5, 9, 10]:
        edu_text += "This strong positioning in a trine or angle in the D24 chart points to high academic capability, deep focus, and successful mastery of professional certifications or advanced higher degrees."
    else:
        edu_text += "This placement suggests that your educational journey requires practical skill development and focus, rather than purely theoretical or conventional classrooms. You will find success in specialised technical or logical streams."
        
    budhaditya = next((y for y in yogas if y["id"] == "Budhaditya_Yoga"), None)
    if budhaditya:
        edu_text += "\n\nYour education is profoundly blessed by the **Budhaditya Yoga** present in your horoscope. This conjunction of the Sun and Mercury illuminates your cognitive faculties, granting excellent memory, high academic honors, and strong analytical skills."
        
    predictions["education"] = {
        "title": "Education, Intellect & Learning",
        "text": edu_text,
        "strength": "Strong" if mercury_house in [1, 5, 9, 10, 11] else "Moderate",
        "divisionalChartRef": "D24 Chaturvimsamsa (Intellectual Achievements)"
    }
    
    # ==================== 2. CAREER (10th House, D10, Saturn/Sun/Rahu) ====================
    career_text = ""
    career_house_sign = get_house_sign(chart_data, 10)
    saturn_house = rashi["Saturn"]["house"]
    saturn_sign = rashi["Saturn"]["signDetails"]["signName"]
    saturn_varga = divisions["10"]["placements"]["Saturn"]
    sat_varga_house = saturn_varga["house"]
    
    saturn_house_rule = get_rule("planets_in_houses", f"Saturn_{saturn_house}")
    sun10_rule = get_rule("planets_in_houses", "Sun_10") if rashi.get("Sun", {}).get("house") == 10 else None
    rahu10_rule = get_rule("planets_in_houses", "Rahu_10") if rashi.get("Rahu", {}).get("house") == 10 else None
    
    career_text += f"Your professional trajectory and social status are defined by the 10th house, which is situated in **{career_house_sign}** in your Natal chart. "
    career_text += f"Saturn, the significator of profession and karma, resides in the **{saturn_house} house** in **{saturn_sign}**. "
    
    if saturn_house_rule:
        career_text += f"\n\n**Classical Signification:** {saturn_house_rule}\n\n"
        
    if sun10_rule:
        career_text += f"Furthermore, your Sun resides in the 10th house: {sun10_rule} "
    if rahu10_rule:
        career_text += f"Rahu in the 10th house adds unique flair: {rahu10_rule} "
        
    career_text += f"Looking deeper into your **D10 Dasamsa Chart** (the key divisional chart for career success), Saturn is situated in the **{sat_varga_house} house** in the sign of **{saturn_varga['signName']}**. "
    if sat_varga_house in [1, 10, 11]:
        career_text += "This highly supportive placement, indicating robust career growth, eventual administrative authority, management capability, and a legacy of professional achievements built over time."
    else:
        career_text += "This placement suggests that career progression will occur through hard work, continuous adaptions, and service. Steady perseverance will pay off, with significant breakthroughs arriving after age 30."
        
    if current_dasha["mahadasha"] in ["Saturn", "Sun"]:
        career_text += f"\n\n**Current Planetary Period Impact:** You are currently in the major planetary period (Mahadasha) of **{current_dasha['mahadasha']}** (until {current_dasha['mdEnd']}). Since this planet is heavily tied to your professional houses, this is a pivotal time for career actions, structural changes, and seeking leadership advancements."
        
    predictions["career"] = {
        "title": "Career, Status & Profession",
        "text": career_text,
        "strength": "High Stability" if saturn_house in [3, 6, 10, 11] else "Growth via Effort",
        "divisionalChartRef": "D10 Dasamsa (Career & Status)"
    }
    
    # ==================== 3. FAMILY & MARRIAGE (2nd/7th House, D9, Venus/Jupiter) ====================
    family_text = ""
    marriage_sign = get_house_sign(chart_data, 7)
    venus_house = rashi["Venus"]["house"]
    venus_sign = rashi["Venus"]["signDetails"]["signName"]
    venus_varga = divisions["9"]["placements"]["Venus"]
    ven_varga_house = venus_varga["house"]
    
    venus_house_rule = get_rule("planets_in_houses", f"Venus_{venus_house}")
    venus7_rule = get_rule("planets_in_houses", "Venus_7") if rashi.get("Venus", {}).get("house") == 7 else None
    
    family_text += f"Your primary partnerships, marriage, and family life are governed by your 7th house, falling in the sign of **{marriage_sign}**. "
    family_text += f"Venus, the planet of love and domestic comforts, is located in the **{venus_house} house** in **{venus_sign}**. "
    
    if venus7_rule:
        family_text += f"\n\n**Ingested Theory for your placement:** {venus7_rule}\n\n"
    elif venus_house_rule:
        family_text += f"\n\n**Venus Signification:** {venus_house_rule}\n\n"
        
    family_text += f"Examining the **D9 Navamsa Chart** (the primary indicator of marital destiny and spouse's character), Venus is placed in the **{ven_varga_house} house** in **{venus_varga['signName']}**. "
    if ven_varga_house in [1, 4, 5, 7, 9]:
        family_text += "This highly favorable D9 layout ensures a supportive, loving, and aesthetically-inclined spouse. You will experience mutual growth, shared luxury, and deep harmony in family matters."
    else:
        family_text += "This placement suggests that relationship harmony will require conscious compromises, effective communication, and setting aside personal egos. Mutual respect will create a solid family foundation."
        
    predictions["family"] = {
        "title": "Family Life, Marriage & Partners",
        "text": family_text,
        "strength": "Highly Harmonious" if venus_house in [2, 4, 7, 9, 11] else "Requires Balance",
        "divisionalChartRef": "D9 Navamsa (Marital Destiny & Spouse)"
    }
    
    # ==================== 4. FINANCE (2nd/11th House, D2, Jupiter/Venus) ====================
    finance_text = ""
    wealth_sign = get_house_sign(chart_data, 2)
    jupiter_house = rashi["Jupiter"]["house"]
    jupiter_sign = rashi["Jupiter"]["signDetails"]["signName"]
    jupiter_varga = divisions["2"]["placements"]["Jupiter"]
    
    jupiter_house_rule = get_rule("planets_in_houses", f"Jupiter_{jupiter_house}")
    moon2_rule = get_rule("planets_in_houses", "Moon_2") if rashi.get("Moon", {}).get("house") == 2 else None
    jup11_rule = get_rule("planets_in_houses", "Jupiter_11") if rashi.get("Jupiter", {}).get("house") == 11 else None
    
    finance_text += f"Your wealth, assets, and accumulated resources are ruled by the 2nd house of **{wealth_sign}** in your natal chart. "
    finance_text += f"Jupiter, the significator of gold and finance (Dhana Karaka), is located in the **{jupiter_house} house** in the sign of **{jupiter_sign}**. "
    
    if jup11_rule:
        finance_text += f"\n\n**Classical Theory on your placement:** {jup11_rule}\n\n"
    elif jupiter_house_rule:
        finance_text += f"\n\n**Jupiter Placement Signification:** {jupiter_house_rule}\n\n"
    if moon2_rule:
        finance_text += f"Additionally, your Moon occupies the 2nd house: {moon2_rule} "
        
    hora_lord = "Sun (Solar/Leo Hora)" if jupiter_varga["signNum"] == 4 else "Moon (Lunar/Cancer Hora)"
    finance_text += f"In your **D2 Hora Chart** (the exclusive divisional chart for wealth allocation), Jupiter falls in the **{hora_lord}**. "
    if jupiter_varga["signNum"] == 4:
        finance_text += "Being in the Solar Hora, wealth is attained through active enterprise, leadership roles, government connections, and personal initiative. You must actively direct your financial plans."
    else:
        finance_text += "Being in the Lunar Hora, wealth is built through steady savings, family assets, liquid investments, service-oriented businesses, and intuitive partnerships. Reinvestment is highly favorable."
        
    cm_yoga = next((y for y in yogas if y["id"] == "Chandra_Mangala_Yoga"), None)
    if cm_yoga:
        finance_text += "\n\nYour chart is blessed with **Chandra Mangala Yoga**, indicating excellent financial reflexes, business intelligence, and a natural knack for spotting lucrative properties and asset investments."
        
    predictions["finance"] = {
        "title": "Finance, Wealth & Assets",
        "text": finance_text,
        "strength": "Affluent & Stable" if jupiter_house in [2, 5, 9, 11] else "Steady Accumulation",
        "divisionalChartRef": "D2 Hora (Wealth Significations)"
    }
    
    # ==================== 5. HEALTH (6th/8th House, D30, Saturn/Mars) ====================
    health_text = ""
    health_sign = get_house_sign(chart_data, 6)
    mars_house = rashi["Mars"]["house"]
    mars_sign = rashi["Mars"]["signDetails"]["signName"]
    saturn_varga_d30 = divisions["30"]["placements"]["Saturn"]
    sat_varga_d30_house = saturn_varga_d30["house"]
    
    mars6_rule = get_rule("planets_in_houses", "Mars_6") if rashi.get("Mars", {}).get("house") == 6 else None
    sat6_rule = get_rule("planets_in_houses", "Saturn_6") if rashi.get("Saturn", {}).get("house") == 6 else None
    
    health_text += f"Your daily vitality, biological resistance, and recovery potential are observed from the 6th house, which is situated in **{health_sign}**. "
    health_text += f"Mars, representing immune response and physical energy, is placed in the **{mars_house} house** in **{mars_sign}**. "
    
    if mars6_rule:
        health_text += f"\n\n**Classical Signification:** {mars6_rule}\n\n"
    if sat6_rule:
        health_text += f"Furthermore, Saturn in the 6th house gives unique protections: {sat6_rule} "
        
    health_text += f"Analyzing your **D30 Trimsamsa Chart** (the key divisional chart representing miseries, disease recovery, and structural vulnerabilities), Saturn is placed in the **{sat_varga_d30_house} house** in **{saturn_varga_d30['signName']}**. "
    if sat_varga_d30_house in [6, 8, 12]:
        health_text += "This placement suggests that maintaining health will require a highly disciplined lifestyle, balanced nutrition, and structured sleep patterns. Watch out for joint pain, bone mineral deficiencies, or digestive issues under stress."
    else:
        health_text += "This placement is highly protective, ensuring quick recovery from illnesses, strong biological resistance, and a long, healthy life backed by physical stamina."
        
    predictions["health"] = {
        "title": "Health, Vitality & Well-being",
        "text": health_text,
        "strength": "Robust Resistance" if mars_house in [3, 6] or rashi.get("Sun", {}).get("house") == 1 else "Requires Disciplined Care",
        "divisionalChartRef": "D30 Trimsamsa (Miseries & Ill-health)"
    }
    
    # ==================== 6. LUCK & LUCK PLACEMENT (9th House, D20, Jupiter) ====================
    luck_text = ""
    luck_sign = get_house_sign(chart_data, 9)
    jup_house = rashi["Jupiter"]["house"]
    jup_sign = rashi["Jupiter"]["signDetails"]["signName"]
    jup_varga_d20 = divisions["20"]["placements"]["Jupiter"]
    jup_varga_d20_house = jup_varga_d20["house"]
    
    jupiter9_rule = get_rule("planets_in_houses", "Jupiter_9") if rashi.get("Jupiter", {}).get("house") == 9 else None
    
    luck_text += f"Your spiritual grace, general fortune, and divine protection (Bhagya) flow from the 9th house, positioned in **{luck_sign}** in your Natal chart. "
    luck_text += f"Jupiter, the planet of grace and higher wisdom, is placed in the **{jup_house} house** in the sign of **{jup_sign}**. "
    
    if jupiter9_rule:
        luck_text += f"\n\n**Classical Text Signification:** {jupiter9_rule}\n\n"
        
    luck_text += f"In your **D20 Vimsamsa Chart** (focusing on spiritual growth, meditative progress, and divine blessings), Jupiter is situated in the **{jup_varga_d20_house} house** in **{jup_varga_d20['signName']}**. "
    if jup_varga_d20_house in [1, 5, 9, 10]:
        luck_text += "This highly spiritual alignment indicates strong ancestral blessings, natural inclination toward philosophy, high moral values, and protection from negative transits. Things will fall into place automatically at the right moment."
    else:
        luck_text += "This alignment indicates that your luck is earned through conscious deeds (Karma), charity, and devotion. Practices like mindfulness, service, and yoga will unlock massive positive energy in your life."
        
    predictions["luck"] = {
        "title": "Luck, Fortune & Spirituality",
        "text": luck_text,
        "strength": "Abundant & Protected" if jup_house in [1, 5, 9, 11] else "Acquired through Merits",
        "divisionalChartRef": "D20 Vimsamsa (Spiritual Alignment)"
    }
    
    return {
        "currentDasha": current_dasha,
        "activeYogas": yogas,
        "predictionsList": list(predictions.values())
    }
