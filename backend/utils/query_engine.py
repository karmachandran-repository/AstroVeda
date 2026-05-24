import os
import re
import datetime
import random
from utils.ingestion_engine import load_knowledge_base

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

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

# Domain mapping specifications
DOMAINS = {
    "career": {
        "title": "Career, Status & Profession",
        "varga": "10",
        "vargaName": "D10 Dasamsa",
        "significators": ["Saturn", "Sun", "Rahu"],
        "keywords": ["job", "jobs", "career", "careers", "work", "working", "promotion", "promotions", "status", "profession", "business", "boss", "salary", "office", "employment", "startup", "venture", "industry"],
        "neutral_reasons": ["indicates a steady, hard-working professional phase with slow, earned progress."],
        "positive_reasons": ["rules administrative power, administrative success, government recognition, or key promotions."],
        "negative_reasons": ["suggests professional delays, testing boundaries, or career service requiring deep patience."]
    },
    "marriage": {
        "title": "Family Life, Marriage & Partners",
        "varga": "9",
        "vargaName": "D9 Navamsa",
        "significators": ["Venus", "Jupiter"],
        "keywords": ["marriage", "married", "marry", "wedding", "husband", "wife", "spouse", "love", "relationship", "relationships", "partner", "partners", "romance", "family", "domestic", "household"],
        "neutral_reasons": ["represents domestic duties, adjustments, and steady commitment to personal partnerships."],
        "positive_reasons": ["grants marital grace, romantic happiness, vehicle of luxury, or a highly supportive life partner."],
        "negative_reasons": ["indicates domestic compromise, potential relationship differences, or tests in emotional patience."]
    },
    "finance": {
        "title": "Finance, Wealth & Assets",
        "varga": "2",
        "vargaName": "D2 Hora",
        "significators": ["Jupiter", "Venus"],
        "keywords": ["wealth", "money", "finance", "finances", "bank", "gold", "property", "house", "buying", "assets", "invest", "rich", "poverty", "earn", "income", "buy", "purchase", "real estate"],
        "neutral_reasons": ["brings a steady, practical period of asset management and standard household earnings."],
        "positive_reasons": ["unlocks sudden financial gains, rich asset accumulation, commercial growth, or prosperous investments."],
        "negative_reasons": ["requires strict financial discipline, cautious budgeting, and avoiding high-risk capital ventures."]
    },
    "education": {
        "title": "Education, Intellect & Learning",
        "varga": "24",
        "vargaName": "D24 Chaturvimsamsa",
        "significators": ["Mercury", "Jupiter"],
        "keywords": ["study", "studies", "studying", "education", "school", "college", "university", "degree", "phd", "exam", "exams", "learn", "intellect", "book", "academic", "scholar"],
        "neutral_reasons": ["encourages structured learning, reading, and steady progression in professional skills."],
        "positive_reasons": ["illuminates academic excellence, successful examinations, scholarly research, or profound certification milestones."],
        "negative_reasons": ["suggests focus challenges, academic distractions, or the need to acquire practical skills rather than theory."]
    },
    "health": {
        "title": "Health, Vitality & Well-being",
        "varga": "30",
        "vargaName": "D30 Trimsamsa",
        "significators": ["Mars", "Saturn"],
        "keywords": ["health", "illness", "disease", "vitality", "cure", "pain", "hospital", "doctor", "recovery", "sick", "injury", "fatigue", "body", "physical", "energy"],
        "neutral_reasons": ["denotes a stable, steady physical state requiring simple, everyday health discipline."],
        "positive_reasons": ["bestows robust physical resistance, rapid healing, physical recovery, and high vitality."],
        "negative_reasons": ["highlights the need for balanced nutrition, physical rest, and avoiding high stress to prevent minor health issues."]
    },
    "luck": {
        "title": "Luck, Fortune & Spirituality",
        "varga": "20",
        "vargaName": "D20 Vimsamsa",
        "significators": ["Jupiter"],
        "keywords": ["luck", "lucky", "fortune", "spirituality", "meditate", "yoga", "guru", "grace", "temple", "blessing", "karma", "destiny", "divine", "philosophy", "charity"],
        "neutral_reasons": ["focuses on standard moral responsibilities, steady ethics, and self-reflection."],
        "positive_reasons": ["brings abundant divine protection, spiritual breakthroughs, deep wisdom, and timely, fortunate coincidences."],
        "negative_reasons": ["suggests that luck must be earned through conscious selfless deeds, acts of charity, and meditative discipline."]
    }
}

def classify_query(query_text):
    # Standardize text
    text = query_text.lower()
    
    # Calculate keyword matches for each domain
    scores = {}
    for dom_key, dom_data in DOMAINS.items():
        score = 0
        for word in dom_data["keywords"]:
            # Simple keyword boundary checks
            pattern = rf"\b{word}"
            if re.search(pattern, text):
                score += 1
        scores[dom_key] = score
        
    # Get highest scoring domain, default to career if no matches
    best_dom = max(scores, key=scores.get)
    if scores[best_dom] == 0:
        # Check sub-words if no exact boundary match
        sub_scores = {}
        for dom_key, dom_data in DOMAINS.items():
            sub_scores[dom_key] = sum(1 for w in dom_data["keywords"] if w in text)
        best_dom = max(sub_scores, key=sub_scores.get)
        if sub_scores[best_dom] == 0:
            best_dom = "career"  # Standard default
            
    return best_dom

def parse_iso(dt_str):
    cleaned = dt_str.replace("Z", "")
    return datetime.datetime.fromisoformat(cleaned)

def analyze_dasha_period(md_planet, ad_planet, chart_data, domain_key):
    domain = DOMAINS[domain_key]
    varga_num = domain["varga"]
    varga_placements = chart_data["divisionalCharts"][varga_num]["placements"]
    rashi_placements = chart_data["rashiPlacements"]
    
    # Get placements in relevant Divisional Chart
    md_varga = varga_placements.get(md_planet)
    ad_varga = varga_placements.get(ad_planet)
    
    if not md_varga or not ad_varga:
        return 50, "Neutral", "This period brings a general and steady energetic influence."
        
    md_house = md_varga["house"]
    ad_house = ad_varga["house"]
    
    # Auspiciousness / Support Score Algorithm
    # Start at a neutral baseline of 50
    score = 50
    
    reasons = []
    
    # 1. House placements in Divisional Chart
    # Kendra (1, 4, 7, 10) or Trikona (5, 9) houses are highly favorable
    # Upachaya (3, 11) is good for career/finance
    # Dusthanas (6, 8, 12) are challenging (especially 8 and 12, 6 is good for health/victory)
    
    # Mahadasha Lord
    if md_house in [1, 4, 7, 10]:
        score += 15
        reasons.append(f"Major period lord {md_planet} occupies a powerful angular house (H{md_house}) in D{varga_num}")
    elif md_house in [5, 9]:
        score += 20
        reasons.append(f"Major period lord {md_planet} sits in an highly auspicious trine house (H{md_house}) in D{varga_num}")
    elif md_house in [6, 8, 12]:
        if domain_key == "health" and md_house == 6:
            score += 10 # 6th is victory/resistance in health
            reasons.append(f"Major period lord {md_planet} sits in the 6th house (vitality and overcoming obstacles) in D{varga_num}")
        else:
            score -= 15
            reasons.append(f"Major period lord {md_planet} occupies a challenging dusthana house (H{md_house}) in D{varga_num}")
            
    # Antardasha Lord
    if ad_house in [1, 4, 7, 10]:
        score += 10
        reasons.append(f"sub-period lord {ad_planet} occupies an angular house (H{ad_house}) in D{varga_num}")
    elif ad_house in [5, 9]:
        score += 12
        reasons.append(f"sub-period lord {ad_planet} sits in a trine house (H{ad_house}) in D{varga_num}")
    elif ad_house in [3, 11] and domain_key in ["career", "finance"]:
        score += 8
        reasons.append(f"sub-period lord {ad_planet} is placed in a supportive Upachaya house (H{ad_house}) in D{varga_num} governing expansion")
    elif ad_house in [6, 8, 12]:
        if domain_key == "health" and ad_house == 6:
            score += 5
        else:
            score -= 10
            reasons.append(f"sub-period lord {ad_planet} is positioned in a challenging dusthana house (H{ad_house}) in D{varga_num}")
            
    # 2. Exaltation / Own Sign checks in D1 (Lagna Rashi)
    md_rashi = rashi_placements.get(md_planet)
    if md_rashi:
        sd = md_rashi["signDetails"]
        # Check standard exaltations/own signs
        is_exalted = False
        is_own = False
        
        # Simple exaltation mapping: Sun-Aries, Moon-Taurus, Mars-Capricorn, Mercury-Virgo, Jupiter-Cancer, Venus-Pisces, Saturn-Libra
        exaltations = {"Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo", "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"}
        own_signs = {
            "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"], 
            "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
            "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"]
        }
        
        if exaltations.get(md_planet) == sd["signName"]:
            score += 15
            reasons.append(f"Major lord {md_planet} is exalted in the natal D1 chart")
        elif sd["signName"] in own_signs.get(md_planet, []):
            score += 10
            reasons.append(f"Major lord {md_planet} is strong in its own sign ({sd['signName']}) in the natal D1 chart")
            
    # Normalize score
    score = max(5, min(95, score))
    
    # Categorize suitability
    if score >= 75:
        support = "Highly Supportive"
        desc = f"A period of significant breakthroughs and positive progress in this domain. {random.choice(domain['positive_reasons'])}"
    elif score >= 60:
        support = "Supportive / Auspicious"
        desc = f"A favorable and productive phase where your efforts are naturally rewarded. {random.choice(domain['positive_reasons'])}"
    elif score <= 35:
        support = "Challenging / Testing"
        desc = f"A phase that demands patience, structural adjustments, and conscious discipline. {random.choice(domain['negative_reasons'])}"
    else:
        support = "Neutral / Stable"
        desc = f"A steady and balanced phase focused on core duties and gradual development. {random.choice(domain['neutral_reasons'])}"
        
    analysis_text = " ".join(reasons) if reasons else "Placements reflect a steady and balanced planetary energetic alignment."
    return score, support, f"{analysis_text} {desc}"

def get_query_prediction(query, chart_data, years_span):
    kb = load_knowledge_base()
    domain_key = classify_query(query)
    domain = DOMAINS[domain_key]
    
    current_time = datetime.datetime.utcnow()
    
    # Setup Dasha timeline
    dashas = chart_data["dashas"]
    
    # Identify:
    # 1. Past/Historical Periods (last 10 years, e.g., current_time - 10 years to current_time)
    # 2. Current Period
    # 3. Future Periods (current_time to current_time + years_span)
    
    past_limit = current_time - datetime.timedelta(days=10*365.25)
    future_limit = current_time + datetime.timedelta(days=years_span*365.25)
    
    timeline_periods = []
    
    # Flatten Dashas list to Antardashas with their parents
    for md in dashas:
        md_planet = md["planet"]
        for ad in md.get("antardashas", []):
            ad_planet = ad["planet"]
            start_dt = parse_iso(ad["startDate"])
            end_dt = parse_iso(ad["endDate"])
            
            # Check overlap with our timeline of interest [past_limit, future_limit]
            # If the Antardasha overlaps, we index it!
            if end_dt >= past_limit and start_dt <= future_limit:
                # Determine status
                if start_dt <= current_time <= end_dt:
                    status = "current"
                elif end_dt < current_time:
                    status = "historical"
                else:
                    status = "future"
                    
                score, support, analysis = analyze_dasha_period(md_planet, ad_planet, chart_data, domain_key)
                
                timeline_periods.append({
                    "mahadasha": md_planet,
                    "antardasha": ad_planet,
                    "startDate": ad["startDate"].split("T")[0],
                    "endDate": ad["endDate"].split("T")[0],
                    "start_ts": start_dt.timestamp(),
                    "status": status,
                    "score": score,
                    "support": support,
                    "analysis": analysis
                })
                
    # Sort timeline chronologically
    timeline_periods.sort(key=lambda x: x["start_ts"])
    
    # Separate historical, current, and future trigger lists
    historical_periods = [p for p in timeline_periods if p["status"] == "historical"]
    current_period = next((p for p in timeline_periods if p["status"] == "current"), None)
    future_periods = [p for p in timeline_periods if p["status"] == "future"]
    
    # Extract RAG rules
    # Retrieve matching rules for placement of current Dasha/Antardasha lords in Varga or Rashi
    matched_rules = []
    
    def add_rules_for_planet(planet):
        # Planets in houses
        p_rashi = chart_data["rashiPlacements"].get(planet)
        if p_rashi:
            p_house = p_rashi["house"]
            p_sign = p_rashi["signDetails"]["signName"]
            
            # Retrieve house rule
            h_key = f"{planet}_{p_house}"
            h_rules = kb.get("planets_in_houses", {}).get(h_key, [])
            for r in h_rules:
                if r not in matched_rules: matched_rules.append(r)
                
            # Retrieve sign rule
            s_key = f"{planet}_{p_sign}"
            s_rules = kb.get("planets_in_signs", {}).get(s_key, [])
            for r in s_rules:
                if r not in matched_rules: matched_rules.append(r)
                
    # Pull rules for significator planets and Dasha lords
    for planet in set(domain["significators"] + ([current_period["mahadasha"], current_period["antardasha"]] if current_period else [])):
        add_rules_for_planet(planet)
        
    # Semantic hit check: scan rules containing the actual query terms
    # Look through all planets_in_houses and planets_in_signs
    semantic_rules = []
    query_words = [w.strip() for w in re.split(r"[^a-zA-Z0-9]", query.lower()) if len(w.strip()) > 3]
    
    # Basic check against key astrological words
    if len(query_words) > 0:
        for cat in ["planets_in_houses", "planets_in_signs", "yogas"]:
            for key, rules_list in kb.get(cat, {}).items():
                for rule in rules_list:
                    # If any keyword matches the rule text
                    rule_lower = rule.lower()
                    matches = sum(1 for word in query_words if word in rule_lower)
                    if matches >= 2 or (matches >= 1 and any(sig.lower() in rule_lower for sig in domain["significators"])):
                        if rule not in matched_rules and rule not in semantic_rules:
                            semantic_rules.append(rule)
                            
    # Combine and limit
    all_retrieved = matched_rules + semantic_rules
    # Select up to 4 high relevance rules for report carousel
    selected_rules = all_retrieved[:4] if len(all_retrieved) >= 4 else all_retrieved
    if len(selected_rules) == 0:
        # Fallback to standard domain rules
        fallback_keys = [f"{sig}_10" for sig in domain["significators"]]
        for k in fallback_keys:
            r = kb.get("planets_in_houses", {}).get(k, [])
            if r: selected_rules.append(r[0])
            
    # Compile synthesized Compassionate & Classical AI narrative
    synthesis = compile_compassionate_synthesis(domain_key, domain, current_period, future_periods, historical_periods, selected_rules, chart_data)
    
    return {
        "success": True,
        "query": query,
        "domain": domain_key,
        "domainTitle": domain["title"],
        "vargaChart": domain["vargaName"],
        "yearsSpan": years_span,
        "historicalPeriods": historical_periods[-3:], # Show last 3 historical periods for calibration
        "currentPeriod": current_period,
        "futurePeriods": future_periods[:5],         # Show up to 5 future periods in the timeline
        "retrievedRules": selected_rules,
        "aiSynthesis": synthesis
    }

def compile_compassionate_synthesis(domain_key, domain, current, future, historical, rules, chart_data):
    varga_name = domain["vargaName"]
    varga_num = domain["varga"]
    
    # 1. Astrological Calibration (Domain Mapping)
    synthesis = f"### 🔮 Astrological Calibration & Domain Mapping\n"
    synthesis += f"To address your query concerning **{domain['title']}**, we calibrate the oracle against your natal chart and specifically inspect the **{varga_name}**—the classical Shodashavarga division that governs this sector of life.\n\n"
    
    lagna_varga = chart_data["divisionalCharts"][varga_num]["placements"]["Lagna"]
    synthesis += f"In your {varga_name}, the rising sign (Varga Lagna) is **{lagna_varga['signName']}**. "
    
    # Map significators placements
    sigs_list = []
    for sig in domain["significators"]:
        p_varga = chart_data["divisionalCharts"][varga_num]["placements"].get(sig)
        if p_varga:
            sigs_list.append(f"{sig} in H{p_varga['house']} ({p_varga['signName']})")
            
    synthesis += f"The key classical significators (Karakas) are placed as follows: {', '.join(sigs_list)}.\n\n"
    
    # 2. Historical Calibration Check (Factual Past)
    synthesis += "### ⏳ Historical Calibration Check (Vimshottari Past)\n"
    if historical:
        # Choose a past period of high support or change
        calib_period = max(historical, key=lambda x: x["score"])
        synthesis += f"To calibrate the astronomical engine against your personal history, we examine a pivotal period in your recent past. "
        synthesis += f"Between **{calib_period['startDate']}** and **{calib_period['endDate']}**, you traversed the **{calib_period['mahadasha']} Mahadasha - {calib_period['antardasha']} Antardasha** period. "
        synthesis += f"Because {calib_period['mahadasha']} and {calib_period['antardasha']} occupied supportive alignments in your {varga_name} (resulting in a domain support score of **{calib_period['score']}/100**), "
        synthesis += f"this is identified as a **{calib_period['support']}** window. During this historical timeline, you likely experienced structural shifts, supportive progress, or critical events that shaped this domain.\n\n"
    else:
        synthesis += "Vimshottari Dasha history shows a stable foundation leading up to this year, marking a gradual, protective evolution of this domain in your life.\n\n"
        
    # 3. Current Influence (Present State)
    synthesis += "### 🌟 Present Influence & Current Dasha\n"
    if current:
        synthesis += f"Currently, you are experiencing the **{current['mahadasha']} Mahadasha - {current['antardasha']} Antardasha** (running until **{current['endDate']}**). "
        synthesis += f"This period is classified as **{current['support']}** (Domain Support: **{current['score']}/100**).\n"
        synthesis += f"**Oracle's View on this placement:** {current['analysis']}\n\n"
    else:
        synthesis += "You are currently in a transition period between major Dasha cycles, a time for reflection and clearing past karmas to prepare for new beginnings.\n\n"
        
    # 4. Favorable Trigger Timeline (Future Outlook)
    synthesis += "### 📅 Chronological Forecast & Favorable Triggers\n"
    if future:
        synthesis += "Scanning your upcoming timeline, the oracle observes the following major astrological activation points:\n"
        
        # Pull high support future dashas
        fav_futures = [p for p in future if p["score"] >= 60]
        if fav_futures:
            for p in fav_futures[:3]:
                synthesis += f"- **{p['startDate']} to {p['endDate']}** ({p['mahadasha']}-{p['antardasha']}): **{p['support']}** (Score: {p['score']}/100). *{p['analysis'].split('.')[-1].strip()}*\n"
        else:
            # If no highly favorable, list the next chronological ones
            for p in future[:2]:
                synthesis += f"- **{p['startDate']} to {p['endDate']}** ({p['mahadasha']}-{p['antardasha']}): **{p['support']}** (Score: {p['score']}/100). *{p['analysis'].split('.')[-1].strip()}*\n"
    else:
        synthesis += "Your upcoming timeline shows a continuation of your present dasha cycles, focusing on stabilizing your current achievements.\n"
        
    # 5. Classical Attributions
    synthesis += "\n### 📜 Classical Astrological Wisdom\n"
    synthesis += "The ancient classical texts (Brihat Parashara Hora Shastra and Phaladeepika) provide the following foundational wisdom concerning your chart configurations:\n"
    
    for r in rules[:2]:
        synthesis += f"> *\"{r}\"*\n\n"
        
    # 6. Compassionate Oracle's Guidance
    synthesis += "### ✨ Oracle's Holistic Guidance & Remedies\n"
    synthesis += "Vedic astrology teaches us that while the planets indicate the flow of destiny (Prarabdha Karma), our conscious action and free will (Kriyaman Karma) are the ultimate shapers of our lives. "
    
    remedies = {
        "career": "To harmonize your career energies, dedicate your efforts to service, practice disciplined focus, and seek advice from experienced mentors. Fostering patience during Saturnian dashas will turn obstacles into permanent structural foundations.",
        "marriage": "To attract marital peace, cultivate absolute emotional transparency and compassionate communication with your partner. Respecting Venusian values of beauty, art, and mutual appreciation will unlock hidden marital blessings.",
        "finance": "For financial abundance, cultivate a practice of regular charity (Danam)—even a tiny fraction of your earnings given selflessly to those in need activates the expansive grace of Jupiter. Focus on steady, ethical asset accumulation.",
        "education": "To sharpen your intellect, balance your analytical studies with practical, hands-on applications. Praying or meditating before studies and organizing your environment will dramatically enhance your cognitive retention.",
        "health": "To fortify your vitality, adopt structured daily routines (Dinacharya) including regular sleep cycles and light exercise (Yoga). Mars-governed periods respond beautifully to disciplined physical care and maintaining low stress.",
        "luck": "To expand your general luck and spiritual grace, connect deeply with nature, practice daily mindfulness or mantra meditation, and seek the blessings of your elders and teachers. Grace flows where humility and gratitude reside."
    }
    
    synthesis += remedies.get(domain_key, "May the cosmic alignments bring wisdom, peace, and stable progress to your path.")
    synthesis += "\n\n*May you walk in alignment with the cosmic rhythm, guided by wisdom and peace.*"
    
    return synthesis
