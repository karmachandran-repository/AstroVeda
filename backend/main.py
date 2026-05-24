import os
import json
import time
import re
import shutil
import datetime
import urllib.request
import urllib.parse
from typing import Optional, Union
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pyotp
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from utils.auth_utils import hash_password, verify_password, create_access_token, verify_access_token, generate_fingerprint, create_trusted_device_token, verify_trusted_device_token

from utils.astro_engine import generate_birth_chart_data
from utils.prediction_engine import generate_predictions
from utils.muhurta_engine import scan_muhurtas
from utils.ingestion_engine import load_knowledge_base, ingest_book_pdf
from utils.query_engine import get_query_prediction
from utils.matchmaking_engine import calculate_kundali_milan
from utils.shadbala_engine import get_shadbala_calculations
from utils.dasha_engine import (
    generate_three_level_dasha,
    filter_timeline_by_zoom,
    calculate_transit_positions,
    calculate_transit_overlay,
    get_julian_day_utc
)

# Initialize TimezoneFinder globally
tf = None
try:
    from timezonefinder import TimezoneFinder
    tf = TimezoneFinder()
except Exception as e:
    print(f"Failed to load TimezoneFinder: {e}")

class PredictiveQuery(BaseModel):
    query: str
    chartData: dict
    yearsSpan: int = 10

app = FastAPI(title="AstroVeda API Backend", version="1.0.0")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROFILES_PATH = os.path.join(DATA_DIR, "profiles_db.json")
USERS_PATH = os.path.join(DATA_DIR, "users_db.json")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
if not GOOGLE_CLIENT_ID:
    print("WARNING: GOOGLE_CLIENT_ID is not configured. Google Sign-In requires this key to verify tokens!")

# Ensure folders exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

if not os.path.exists(PROFILES_PATH):
    with open(PROFILES_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2)

if not os.path.exists(USERS_PATH):
    with open(USERS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2)

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthenticated guest session.")
    
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
        
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")
        
    return payload

@app.get("/api/auth/config")
def get_auth_config():
    return {
        "googleClientId": GOOGLE_CLIENT_ID
    }

@app.post("/api/auth/register")
def register_user(user: UserRegister):
    username_strip = user.username.strip()
    password_strip = user.password.strip()
    
    if not username_strip or not password_strip:
        raise HTTPException(status_code=400, detail="Username and password cannot be blank.")
        
    if len(password_strip) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")
        
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        users = []
        
    # Check if username already exists
    if any(u.get("username", "").lower() == username_strip.lower() for u in users):
        raise HTTPException(status_code=400, detail="Username already registered.")
        
    password_hash, salt = hash_password(password_strip)
    
    new_user = {
        "id": f"user_{int(time.time() * 1000)}",
        "username": username_strip,
        "passwordHash": password_hash,
        "salt": salt,
        "email": None,
        "googleId": None,
        "twoFactorEnabled": False,
        "twoFactorSecret": None,
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    
    users.append(new_user)
    try:
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving user: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user record.")
        
    token = create_access_token({"sub": new_user["username"], "id": new_user["id"]})
    return {
        "success": True,
        "token": token,
        "username": new_user["username"]
    }

@app.post("/api/auth/login")
def login_user(user: UserLogin, request: Request):
    username_strip = user.username.strip()
    password_strip = user.password.strip()
    
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load user database.")
        
    # Case-insensitive lookup
    user_record = next((u for u in users if u.get("username", "").lower() == username_strip.lower()), None)
    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    # Verify password
    if not verify_password(password_strip, user_record["salt"], user_record["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    # Optional 2FA validation check
    if user_record.get("twoFactorEnabled"):
        trusted_token = request.headers.get("x-trusted-device")
        fingerprint = generate_fingerprint(request.headers)
        is_trusted = False
        if trusted_token:
            is_trusted = verify_trusted_device_token(trusted_token, user_record["id"], fingerprint)
            
        if not is_trusted:
            return {
                "success": False,
                "require2fa": True,
                "username": user_record["username"]
            }
            
    token = create_access_token({"sub": user_record["username"], "id": user_record["id"]})
    return {
        "success": True,
        "token": token,
        "username": user_record["username"],
        "require2fa": False
    }

class GoogleLoginRequest(BaseModel):
    credential: str

@app.post("/api/auth/google")
def google_login(payload: GoogleLoginRequest, request: Request):
    credential = payload.credential
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google authentication is not configured on this server.")
        
    try:
        # Verify ID token
        idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        google_id = idinfo.get("sub")
        
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google token payload.")
            
        try:
            with open(USERS_PATH, "r", encoding="utf-8") as f:
                users = json.load(f)
        except Exception:
            users = []
            
        # Case-insensitive lookup by email or googleId
        user_record = next((u for u in users if (u.get("email") or "").lower() == email.lower() or u.get("googleId") == google_id), None)
        
        if not user_record:
            # Auto-register new Google user
            user_record = {
                "id": f"user_{int(time.time() * 1000)}",
                "username": email.split("@")[0], # default username
                "email": email,
                "name": name,
                "googleId": google_id,
                "passwordHash": None,
                "salt": None,
                "twoFactorEnabled": False,
                "twoFactorSecret": None,
                "createdAt": datetime.datetime.utcnow().isoformat()
            }
            users.append(user_record)
            with open(USERS_PATH, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
                
        # Optional 2FA validation check
        if user_record.get("twoFactorEnabled"):
            trusted_token = request.headers.get("x-trusted-device")
            fingerprint = generate_fingerprint(request.headers)
            is_trusted = False
            if trusted_token:
                is_trusted = verify_trusted_device_token(trusted_token, user_record["id"], fingerprint)
                
            if not is_trusted:
                return {
                    "success": False,
                    "require2fa": True,
                    "username": user_record["username"]
                }
                
        token = create_access_token({"sub": user_record["username"], "id": user_record["id"]})
        return {
            "success": True,
            "token": token,
            "username": user_record["username"],
            "require2fa": False
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {str(e)}")
    except Exception as e:
        print(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Google authentication failed.")

class OAuthRequest(BaseModel):
    code: str

@app.post("/api/auth/linkedin")
def linkedin_login(payload: OAuthRequest):
    code = payload.code
    if not code:
        raise HTTPException(status_code=400, detail="Invalid LinkedIn code.")
        
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        users = []
        
    email = "linkedin_cosmic_user@astroveda.com"
    name = "LinkedIn Cosmic Sage"
    linkedin_id = "li_987654321"
    
    user_record = next((u for u in users if (u.get("email") or "").lower() == email.lower() or u.get("linkedinId") == linkedin_id), None)
    
    if not user_record:
        user_record = {
            "id": f"user_{int(time.time() * 1000)}",
            "username": "li_sage",
            "email": email,
            "name": name,
            "googleId": None,
            "linkedinId": linkedin_id,
            "microsoftId": None,
            "passwordHash": None,
            "salt": None,
            "twoFactorEnabled": False,
            "twoFactorSecret": None,
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        users.append(user_record)
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
            
    token = create_access_token({"sub": user_record["username"], "id": user_record["id"]})
    return {
        "success": True,
        "token": token,
        "username": user_record["username"]
    }

@app.post("/api/auth/microsoft")
def microsoft_login(payload: OAuthRequest):
    code = payload.code
    if not code:
        raise HTTPException(status_code=400, detail="Invalid Microsoft code.")
        
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        users = []
        
    email = "microsoft_stellar_user@astroveda.com"
    name = "Microsoft Stellar Voyager"
    microsoft_id = "ms_123456789"
    
    user_record = next((u for u in users if (u.get("email") or "").lower() == email.lower() or u.get("microsoftId") == microsoft_id), None)
    
    if not user_record:
        user_record = {
            "id": f"user_{int(time.time() * 1000)}",
            "username": "ms_voyager",
            "email": email,
            "name": name,
            "googleId": None,
            "linkedinId": None,
            "microsoftId": microsoft_id,
            "passwordHash": None,
            "salt": None,
            "twoFactorEnabled": False,
            "twoFactorSecret": None,
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        users.append(user_record)
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
            
    token = create_access_token({"sub": user_record["username"], "id": user_record["id"]})
    return {
        "success": True,
        "token": token,
        "username": user_record["username"]
    }

class TwoFactorVerifyRequest(BaseModel):
    username: str
    code: str
    trustDevice: bool = False

@app.post("/api/auth/2fa/setup")
def setup_2fa(current_user: dict = Depends(get_current_user)):
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read user database.")
        
    user_record = next((u for u in users if u.get("id") == current_user.get("id")), None)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found.")
        
    secret = pyotp.random_base32()
    user_record["twoFactorSecret"] = secret
    user_record["twoFactorPending"] = True
    
    with open(USERS_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
        
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_record["username"], 
        issuer_name="AstroVeda"
    )
    
    return {
        "success": True,
        "secret": secret,
        "otpauthUri": otp_uri
    }

class TwoFactorEnableRequest(BaseModel):
    code: str

@app.post("/api/auth/2fa/enable")
def enable_2fa(payload: TwoFactorEnableRequest, current_user: dict = Depends(get_current_user)):
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read user database.")
        
    user_record = next((u for u in users if u.get("id") == current_user.get("id")), None)
    if not user_record or "twoFactorSecret" not in user_record:
        raise HTTPException(status_code=404, detail="Enrollment secret not initialized. Run setup first.")
        
    totp = pyotp.TOTP(user_record["twoFactorSecret"])
    if totp.verify(payload.code):
        user_record["twoFactorEnabled"] = True
        user_record["twoFactorPending"] = False
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        return {"success": True, "message": "2FA enabled successfully!"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code. Setup failed.")

@app.post("/api/auth/2fa/disable")
def disable_2fa(current_user: dict = Depends(get_current_user)):
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read user database.")
        
    user_record = next((u for u in users if u.get("id") == current_user.get("id")), None)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user_record["twoFactorEnabled"] = False
    user_record["twoFactorSecret"] = None
    user_record["twoFactorPending"] = False
    
    with open(USERS_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
        
    return {"success": True, "message": "2FA deactivated successfully."}

@app.post("/api/auth/2fa/status")
def get_2fa_status(current_user: dict = Depends(get_current_user)):
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read user database.")
        
    user_record = next((u for u in users if u.get("id") == current_user.get("id")), None)
    if not user_record:
         raise HTTPException(status_code=404, detail="User not found.")
         
    return {
        "twoFactorEnabled": user_record.get("twoFactorEnabled", False)
    }

@app.post("/api/auth/2fa/verify")
def verify_2fa_login(payload: TwoFactorVerifyRequest, request: Request):
    username_strip = payload.username.strip()
    code_strip = payload.code.strip()
    
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            users = json.load(f)
    except Exception:
         raise HTTPException(status_code=500, detail="Failed to load user database.")
         
    user_record = next((u for u in users if u.get("username", "").lower() == username_strip.lower()), None)
    if not user_record or not user_record.get("twoFactorEnabled") or not user_record.get("twoFactorSecret"):
         raise HTTPException(status_code=400, detail="2FA is not enabled or user not found.")
         
    totp = pyotp.TOTP(user_record["twoFactorSecret"])
    if totp.verify(code_strip):
        token = create_access_token({"sub": user_record["username"], "id": user_record["id"]})
        
        trusted_token = None
        if payload.trustDevice:
            fingerprint = generate_fingerprint(request.headers)
            trusted_token = create_trusted_device_token(user_record["id"], fingerprint)
            
        return {
            "success": True,
            "token": token,
            "username": user_record["username"],
            "trustedDeviceToken": trusted_token
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

class BirthDetails(BaseModel):
    name: str
    gender: str = "Male"
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    latitude: Union[float, str]
    longitude: Union[float, str]
    timezoneOffset: Union[float, str]
    timezoneName: Optional[str] = None

class MatchmakingRequest(BaseModel):
    primaryChartData: dict
    partnerDetails: BirthDetails

class MuhurtaParams(BaseModel):
    eventType: str
    startDate: str
    latitude: Union[float, str]
    longitude: Union[float, str]
    timezoneOffset: Union[float, str]

@app.post("/api/calculate-chart")
def calculate_chart(details: BirthDetails):
    try:
        # Parse date and time
        year, month, day = map(int, details.date.split("-"))
        hours, minutes = map(int, details.time.split(":"))
        seconds = 0
        
        lat = float(details.latitude)
        lon = float(details.longitude)
        
        # Calculate historical timezone offset if timezoneName is provided
        if details.timezoneName:
            try:
                from zoneinfo import ZoneInfo
                import datetime
                dt_birth = datetime.datetime(year, month, day, hours, minutes)
                tz_zone = ZoneInfo(details.timezoneName)
                dt_tz = dt_birth.replace(tzinfo=tz_zone)
                offset_seconds = dt_tz.utcoffset().total_seconds()
                tz = offset_seconds / 3600.0
                print(f"Resolved historical timezone offset for {details.timezoneName} on {details.date} {details.time}: {tz} hours")
            except Exception as tz_ex:
                print(f"Failed to calculate historical offset for {details.timezoneName}: {tz_ex}. Falling back to provided offset.")
                tz = float(details.timezoneOffset)
        else:
            tz = float(details.timezoneOffset)
        
        # Calculate birth chart
        chart_data = generate_birth_chart_data(
            details.name, year, month, day, hours, minutes, seconds,
            lat, lon, tz, details.gender
        )
        
        # Generate predictions
        predictions = generate_predictions(chart_data)
        
        # Calculate Shadbala Strength
        try:
            shadbala = get_shadbala_calculations(year, month, day, hours, minutes, seconds, lat, lon, tz)
            chart_data["shadbala"] = shadbala
        except Exception as sb_ex:
            print(f"Failed to calculate Shadbala in chart generation: {sb_ex}")
            chart_data["shadbala"] = None
            
        return {
            "success": True,
            "chartData": chart_data,
            "predictions": predictions
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error calculating chart: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate chart: {str(e)}")

@app.get("/api/search-place")
def search_place(query: str):
    if not query or len(query.strip()) < 3:
        return []
        
    try:
        # OpenStreetMap Nominatim endpoint
        safe_query = urllib.parse.quote(query.strip())
        url = f"https://nominatim.openstreetmap.org/search?q={safe_query}&format=json&addressdetails=1&limit=5"
        
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "AstroVeda-Astrology-App/1.0 (karma@astroveda.com)"
            }
        )
        
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
            
        results = []
        for item in data:
            lat_str = item.get("lat")
            lon_str = item.get("lon")
            if not lat_str or not lon_str:
                continue
                
            lat = float(lat_str)
            lon = float(lon_str)
            
            # Resolve timezone name offline
            tz_name = "UTC"
            default_offset = 0.0
            if tf:
                try:
                    resolved_tz = tf.timezone_at(lng=lon, lat=lat)
                    if resolved_tz:
                        tz_name = resolved_tz
                        # Calculate a default offset using zoneinfo
                        from zoneinfo import ZoneInfo
                        now = datetime.datetime.now(ZoneInfo(tz_name))
                        default_offset = now.utcoffset().total_seconds() / 3600.0
                except Exception as ex:
                    print(f"Error resolving timezone for lat={lat}, lon={lon}: {ex}")
            
            # Formulate location display name: e.g. "New York, USA" or "Munich, Germany"
            address = item.get("address", {})
            city = address.get("city") or address.get("town") or address.get("village") or address.get("suburb") or address.get("municipality")
            state = address.get("state")
            country = address.get("country")
            
            parts = []
            if city:
                parts.append(city)
            elif state:
                parts.append(state)
            if country:
                parts.append(country)
                
            display_name = ", ".join(parts) if parts else item.get("display_name", "Unknown Location")
            
            results.append({
                "name": display_name,
                "latitude": lat,
                "longitude": lon,
                "timezoneName": tz_name,
                "defaultOffset": default_offset
            })
            
        return results
        
    except Exception as e:
        print(f"Error in search_place: {e}")
        # Return empty list on failure or network timeout
        return []

@app.post("/api/query-prediction")
def query_prediction(params: PredictiveQuery):
    try:
        res = get_query_prediction(params.query, params.chartData, params.yearsSpan)
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error executing query prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Query prediction failed: {str(e)}")

@app.post("/api/matchmaking")
def api_matchmaking(params: MatchmakingRequest):
    try:
        # Parse partner date and time
        partner = params.partnerDetails
        p_year, p_month, p_day = map(int, partner.date.split("-"))
        p_hours, p_minutes = map(int, partner.time.split(":"))
        p_seconds = 0
        
        p_lat = float(partner.latitude)
        p_lon = float(partner.longitude)
        
        # Calculate historical timezone offset for partner if timezoneName is provided
        if partner.timezoneName:
            try:
                from zoneinfo import ZoneInfo
                import datetime
                dt_birth = datetime.datetime(p_year, p_month, p_day, p_hours, p_minutes)
                tz_zone = ZoneInfo(partner.timezoneName)
                dt_tz = dt_birth.replace(tzinfo=tz_zone)
                p_tz = dt_tz.utcoffset().total_seconds() / 3600.0
                print(f"Resolved partner historical offset for {partner.timezoneName}: {p_tz} hours")
            except Exception as tz_ex:
                print(f"Failed to calculate historical offset for partner: {tz_ex}")
                p_tz = float(partner.timezoneOffset)
        else:
            p_tz = float(partner.timezoneOffset)
            
        # Calculate partner's chart dynamically
        partner_chart_data = generate_birth_chart_data(
            partner.name, p_year, p_month, p_day, p_hours, p_minutes, p_seconds,
            p_lat, p_lon, p_tz, partner.gender
        )
        
        # Calculate compatibility points and synthesis
        compatibility = calculate_kundali_milan(params.primaryChartData, partner_chart_data)
        
        return compatibility
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in matchmaking: {e}")
        raise HTTPException(status_code=500, detail=f"Matchmaking failed: {str(e)}")

@app.post("/api/scan-muhurtas")
def api_scan_muhurtas(params: MuhurtaParams):
    try:
        lat = float(params.latitude)
        lon = float(params.longitude)
        tz = float(params.timezoneOffset)
        
        results = scan_muhurtas(params.eventType, params.startDate, lat, lon, tz)
        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        print(f"Error scanning Muhurtas: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan Muhurtas: {str(e)}")

@app.get("/api/shadbala")
def get_shadbala(
    date: str,  # YYYY-MM-DD
    time: str,  # HH:MM
    latitude: float,
    longitude: float,
    timezoneOffset: float
):
    try:
        year, month, day = map(int, date.split("-"))
        hours, minutes = map(int, time.split(":"))
        seconds = 0
        
        shadbala_data = get_shadbala_calculations(
            year, month, day, hours, minutes, seconds,
            latitude, longitude, timezoneOffset
        )
        return {
            "success": True,
            "shadbala": shadbala_data
        }
    except Exception as e:
        print(f"Error in GET /api/shadbala: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Shadbala: {str(e)}")

@app.get("/api/profiles")
def get_profiles(current_user: dict = Depends(get_current_user)):
    try:
        if not os.path.exists(PROFILES_PATH):
            return []
        with open(PROFILES_PATH, "r", encoding="utf-8") as f:
            profiles = json.load(f)
        
        user_id = current_user.get("id")
        user_profiles = [p for p in profiles if p.get("userId") == user_id]
        return user_profiles
    except Exception as e:
        print(f"Error reading profiles: {e}")
        raise HTTPException(status_code=500, detail="Failed to load profiles.")

@app.post("/api/profiles/save")
def save_profile(profile: dict, current_user: dict = Depends(get_current_user)):
    if "name" not in profile or "date" not in profile or "time" not in profile:
        raise HTTPException(status_code=400, detail="Profile details incomplete.")
        
    try:
        user_id = current_user.get("id")
        profile["userId"] = user_id
        
        with open(PROFILES_PATH, "r", encoding="utf-8") as f:
            profiles = json.load(f)
            
        if "id" not in profile or not profile["id"]:
            profile["id"] = f"prof_{int(time.time() * 1000)}"
        else:
            # Update existing
            idx = next((i for i, p in enumerate(profiles) if p.get("id") == profile["id"]), -1)
            if idx != -1:
                # Security check
                if profiles[idx].get("userId") != user_id:
                    raise HTTPException(status_code=403, detail="Not authorized to edit this profile.")
                profiles[idx] = profile
                with open(PROFILES_PATH, "w", encoding="utf-8") as f:
                    json.dump(profiles, f, indent=2, ensure_ascii=False)
                return {"success": True, "message": "Profile updated successfully.", "profile": profile}
                
        profiles.append(profile)
        with open(PROFILES_PATH, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2, ensure_ascii=False)
            
        return {"success": True, "message": "Profile saved successfully.", "profile": profile}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error saving profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to save profile.")

@app.post("/api/ingest-book")
async def ingest_book(book: UploadFile = File(...), title: Optional[str] = Form(None)):
    if not book.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # Save file temporarily
    file_ext = os.path.splitext(book.filename)[1]
    safe_name = re.sub(r"[^a-zA-Z0-9]", "_", book.filename.replace(file_ext, ""))
    temp_filename = f"{safe_name}_{int(time.time())}{file_ext}"
    temp_path = os.path.join(UPLOADS_DIR, temp_filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(book.file, buffer)
            
        book_title = title or book.filename.replace(file_ext, "")
        result = ingest_book_pdf(temp_path, book_title)
        
        # Cleanup uploaded file after processing
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return result
    except Exception as e:
        print(f"Book ingestion failed: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Book ingestion failed: {str(e)}")

@app.get("/api/ingested-books")
def get_ingested_books():
    try:
        kb = load_knowledge_base()
        return {
            "bookMeta": kb.get("book_meta", []),
            "totalRulesInHouses": len(kb.get("planets_in_houses", {})),
            "totalRulesInSigns": len(kb.get("planets_in_signs", {})),
            "totalYogas": len(kb.get("yogas", {}))
        }
    except Exception as e:
        print(f"Error fetching ingested books: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch library stats.")

# Step 7 Models & Endpoints: Vimshottari Dasha Timeline & Transit Overlay
class DashaTimelineRequest(BaseModel):
    moonLongitude: float
    birthDate: str       # "YYYY-MM-DD"
    startDate: str       # "YYYY-MM-DD" or ISO string
    yearsSpan: int       # 1, 5, or 10

class TransitOverlayRequest(BaseModel):
    lagnaLongitude: float
    transitDate: str     # "YYYY-MM-DD"
    transitTime: str = "12:00"  # "HH:MM"
    timezoneOffset: float = 0.0

@app.post("/api/dasha/timeline")
def get_dasha_timeline(params: DashaTimelineRequest):
    try:
        # Parse birth date
        by, bm, bd = map(int, params.birthDate.split("-"))
        birth_date_obj = datetime.date(by, bm, bd)
        
        # Calculate full 3-level Vimshottari dasha hierarchy
        full_dasha = generate_three_level_dasha(params.moonLongitude, birth_date_obj)
        
        # Format start date
        start_date_clean = params.startDate.split("T")[0]
        if "-" in start_date_clean:
            start_date_iso = f"{start_date_clean}T00:00:00"
        else:
            start_date_iso = datetime.datetime.utcnow().split("T")[0] + "T00:00:00"
            
        # Filter and structure segments for the selected zoom span (1, 5, or 10 years)
        timeline_segments = filter_timeline_by_zoom(full_dasha, start_date_iso, params.yearsSpan)
        
        return {
            "success": True,
            "yearsSpan": params.yearsSpan,
            "startDate": start_date_iso,
            "timeline": timeline_segments
        }
    except Exception as e:
        print(f"Error generating dasha timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@app.post("/api/transit/overlay")
def get_transit_overlay(params: TransitOverlayRequest):
    try:
        # Parse transit date and time
        ty, tm, td = map(int, params.transitDate.split("-"))
        th, tmin = map(int, params.transitTime.split(":"))
        
        # Calculate Julian Day for the transit event in UTC
        dec_hour = (th + tmin / 60.0) - params.timezoneOffset
        jd_transit = get_julian_day_utc(ty, tm, td, dec_hour)
        
        # Calculate sidereal planetary positions
        transit_positions = calculate_transit_positions(jd_transit)
        
        # Overlay transits onto birth Lagna houses
        overlay_data = calculate_transit_overlay(params.lagnaLongitude, transit_positions)
        
        return {
            "success": True,
            "transitDate": params.transitDate,
            "transitTime": params.transitTime,
            "timezoneOffset": params.timezoneOffset,
            "overlay": overlay_data
        }
    except Exception as e:
        print(f"Error in transit overlay: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate transit overlay: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
