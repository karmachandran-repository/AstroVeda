import os
import re
import json
import datetime
from pypdf import PdfReader

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_db.json")

DEFAULT_KNOWLEDGE = {
    "planets_in_houses": {
        "Sun_1": ["Sun in the 1st house gives strong leadership qualities, high self-esteem, but can make the native proud or hot-tempered. Education is usually pursued with strong personal drive. Prominent in career."],
        "Sun_10": ["Sun in the 10th house is exceptionally strong, giving high government status, authority, fame, and rapid career advancement. Highly ambitious and successful."],
        "Moon_2": ["Moon in the 2nd house gives fluctuating finances, beautiful face, attractive voice, and deep attachment to family. A career in hospitality, water, or public relations is favored."],
        "Moon_4": ["Moon in the 4th house is highly auspicious, representing comfort, a loving mother, vehicle ownership, a beautiful home, and deep emotional peace. Exceptional family life."],
        "Mars_3": ["Mars in the 3rd house indicates immense courage, athletic ability, determination, and short travels. Can cause arguments or conflict with siblings but excellent for luck and initiative."],
        "Mars_6": ["Mars in the 6th house is highly favorable (Upachaya house), giving the power to defeat enemies, conquer disease, and thrive in competitive fields like sports, law, or military."],
        "Mercury_5": ["Mercury in the 5th house indicates exceptional intelligence, sharp logic, skills in mathematics or coding, analytical educational achievements, and healthy children. Profitable investments."],
        "Mercury_10": ["Mercury in the 10th house makes the native a brilliant communicator, writer, advisor, or business entrepreneur. Leads to multi-tasking careers and high education levels."],
        "Jupiter_9": ["Jupiter in the 9th house is a supreme placement, indicating profound wisdom, strong luck, religious/spiritual nature, good relationship with father, and stellar higher education."],
        "Jupiter_11": ["Jupiter in the 11th house brings massive financial gains, broad social circles, fulfillment of all desires, and highly influential friends. Prosperous and luck-filled life."],
        "Venus_7": ["Venus in the 7th house gives a beautiful, loving, and artistic spouse. Exceptional marital happiness, successful partnerships, and massive comfort in family life."],
        "Venus_2": ["Venus in the 2nd house ensures sweet speech, luxurious wealth, delicious food, artistic inclinations, and a harmonious family atmosphere."],
        "Saturn_10": ["Saturn in the 10th house indicates hard work, career stability attained after obstacles, steady growth, and authority in administrative or industrial fields. Slow but enduring success."],
        "Saturn_6": ["Saturn in the 6th house is excellent for victory over legal challenges, hard-working attitude, resilience, and maintaining long-term physical health through discipline."],
        "Rahu_10": ["Rahu in the 10th house gives an unconventional career path, immense ambition, mastery of technology, foreign business networks, and sudden rise in social status."],
        "Ketu_12": ["Ketu in the 12th house is the ultimate placement for Moksha (spiritual liberation), granting deep intuition, interest in meditation, mystical dreams, and a detached perspective on material things."]
    },
    "planets_in_signs": {
        "Sun_Leo": ["Sun in its own sign Leo gives regal majesty, strong willpower, creative self-expression, magnanimity, and a natural commanding presence."],
        "Sun_Aries": ["Sun is exalted in Aries. This grants supreme vitality, courage, pioneering spirit, immense career potential, and sharp intellect."],
        "Moon_Taurus": ["Moon is exalted in Taurus, giving complete emotional stability, love for music, luxury, stable finances, and a highly nurturing, elegant temperament."],
        "Jupiter_Cancer": ["Jupiter is exalted in Cancer. It denotes profound spiritual wisdom, immense wealth, charitable nature, excellent education, and deep family devotion."],
        "Saturn_Libra": ["Saturn is exalted in Libra. It represents exceptional fairness, diplomatic excellence, legal success, long-term partnerships, and structured mass leadership."]
    },
    "yogas": {
        "Gaja_Kesari_Yoga": ["Gaja Kesari Yoga (Jupiter in an angular house from the Moon): It bestows immense intelligence, reputation, wealth, high status, and enduring success. The native conquers all obstacles effortlessly."],
        "Budhaditya_Yoga": ["Budhaditya Yoga (Sun conjunct Mercury in the same sign): This makes the native extremely intelligent, sharp-minded, analytical, eloquent, and highly respected in educational and intellectual fields."],
        "Chandra_Mangala_Yoga": ["Chandra Mangala Yoga (Moon conjunct or aspecting Mars): This indicates strong earning capacity, sharp business acumen, aggressive financial drive, and accumulation of properties."]
    },
    "book_meta": []
}

def init_db():
    dir_name = os.path.dirname(DB_PATH)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_KNOWLEDGE, f, indent=2, ensure_ascii=False)

def load_knowledge_base():
    init_db()
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading knowledge database, using defaults: {e}")
        return DEFAULT_KNOWLEDGE

def save_knowledge_base(data):
    init_db()
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def extract_astrological_rules(text, book_title):
    kb = load_knowledge_base()
    
    # Clean text and split into sentences
    cleaned_text = re.sub(r"\s+", " ", text)
    sentences = re.split(r"[\.\!\?]+", cleaned_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
    
    houses = [
        {"name": "1st house", "key": "1"}, {"name": "2nd house", "key": "2"},
        {"name": "3rd house", "key": "3"}, {"name": "4th house", "key": "4"},
        {"name": "5th house", "key": "5"}, {"name": "6th house", "key": "6"},
        {"name": "7th house", "key": "7"}, {"name": "8th house", "key": "8"},
        {"name": "9th house", "key": "9"}, {"name": "10th house", "key": "10"},
        {"name": "11th house", "key": "11"}, {"name": "12th house", "key": "12"}
    ]
    
    signs = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    
    yogas = [
        {"name": "Gaja Kesari", "key": "Gaja_Kesari_Yoga"},
        {"name": "Budhaditya", "key": "Budhaditya_Yoga"},
        {"name": "Chandra Mangala", "key": "Chandra_Mangala_Yoga"}
    ]
    
    rules_ingested = 0
    
    for sentence in sentences:
        # 1. Scan for Planets in Houses (e.g. "Jupiter in the 10th house")
        for p in planets:
            for h in houses:
                h_name = h["name"]
                # Match planet then house or house then planet (max 40 chars between)
                pattern = rf"{p}.{{1,40}}{h_name}|{h_name}.{{1,40}}{p}"
                if re.search(pattern, sentence, re.IGNORECASE):
                    key = f"{p}_{h['key']}"
                    if key not in kb["planets_in_houses"]:
                        kb["planets_in_houses"][key] = []
                    
                    full_rule = f"{sentence} (Source: {book_title})"
                    if full_rule not in kb["planets_in_houses"][key]:
                        kb["planets_in_houses"][key].append(full_rule)
                        rules_ingested += 1
                        
        # 2. Scan for Planets in Signs (e.g. "Saturn in Libra")
        for p in planets:
            for s in signs:
                pattern = rf"{p}.{{1,30}}in\s+{s}"
                if re.search(pattern, sentence, re.IGNORECASE):
                    key = f"{p}_{s}"
                    if key not in kb["planets_in_signs"]:
                        kb["planets_in_signs"][key] = []
                        
                    full_rule = f"{sentence} (Source: {book_title})"
                    if full_rule not in kb["planets_in_signs"][key]:
                        kb["planets_in_signs"][key].append(full_rule)
                        rules_ingested += 1
                        
        # 3. Scan for Yogas
        for y in yogas:
            if re.search(rf"{y['name']}", sentence, re.IGNORECASE):
                key = y["key"]
                if key not in kb["yogas"]:
                    kb["yogas"][key] = []
                    
                full_rule = f"{sentence} (Source: {book_title})"
                if full_rule not in kb["yogas"][key]:
                    kb["yogas"][key].append(full_rule)
                    rules_ingested += 1
                    
    # Track book metadata
    if "book_meta" not in kb:
        kb["book_meta"] = []
        
    existing_book = next((b for b in kb["book_meta"] if b["title"] == book_title), None)
    if existing_book:
        existing_book["rulesCount"] += rules_ingested
        existing_book["dateIngested"] = datetime.datetime.now().isoformat()
    else:
        kb["book_meta"].append({
            "title": book_title,
            "rulesCount": rules_ingested,
            "dateIngested": datetime.datetime.now().isoformat()
        })
        
    save_knowledge_base(kb)
    return rules_ingested

def ingest_book_pdf(file_path, custom_title=None):
    title = custom_title or os.path.basename(file_path).replace(".pdf", "")
    
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
            
        rules_count = extract_astrological_rules(text, title)
        
        return {
            "success": True,
            "title": title,
            "pages": len(reader.pages),
            "rulesIngested": rules_count
        }
    except Exception as e:
        print(f"Failed to parse PDF: {e}")
        raise e
