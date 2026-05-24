import hashlib
import secrets
import datetime
from typing import Optional
from jose import jwt, JWTError

import os

# Standard security keys loading from environment in production
SECRET_KEY = os.environ.get("JWT_SECRET", "astroveda_cosmic_secret_key_stellar_alignment_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hashes a password using SHA-256 with a unique salt.
    Returns (password_hash, salt).
    """
    if not salt:
        salt = secrets.token_hex(16)  # Generate 32-character hex salt
    
    # Hash password combined with salt
    hash_obj = hashlib.sha256()
    hash_obj.update((password + salt).encode('utf-8'))
    password_hash = hash_obj.hexdigest()
    
    return password_hash, salt

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """
    Verifies that a password matches its stored hash when salted.
    """
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, password_hash)

def create_access_token(data: dict) -> str:
    """
    Generates a JWT access token containing user metadata and an expiration date.
    """
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[dict]:
    """
    Validates a JWT token and returns its decoded payload. Returns None if invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_fingerprint(headers: dict) -> str:
    """
    Computes a cryptographic signature identifying the device using stable request headers.
    """
    user_agent = headers.get("user-agent", "").lower().strip()
    accept_lang = headers.get("accept-language", "").lower().strip()
    raw = f"{user_agent}|{accept_lang}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def create_trusted_device_token(user_id: str, fingerprint: str) -> str:
    """
    Generates a secure 30-day JWT token binding the user session to the device fingerprint.
    """
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    to_encode = {
        "sub": user_id,
        "fingerprint": fingerprint,
        "exp": expire,
        "type": "trusted_device"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_trusted_device_token(token: str, user_id: str, fingerprint: str) -> bool:
    """
    Validates the 30-day trusted device token against user ID and request fingerprint.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "trusted_device":
            return False
        if payload.get("sub") != user_id:
            return False
        if payload.get("fingerprint") != fingerprint:
            return False
        return True
    except JWTError:
        return False

