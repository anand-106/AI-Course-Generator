from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Patch bcrypt to automatically truncate passwords > 72 bytes
# This prevents errors during passlib's internal bug detection tests
try:
    import bcrypt
    _original_hashpw = bcrypt.hashpw
    
    def _patched_hashpw(secret, salt):
        """Patch bcrypt.hashpw to truncate passwords > 72 bytes"""
        # bcrypt.hashpw expects bytes
        if isinstance(secret, str):
            secret = secret.encode('utf-8')
        # Truncate to 72 bytes if too long
        if len(secret) > 72:
            secret = secret[:72]
        return _original_hashpw(secret, salt)
    
    bcrypt.hashpw = _patched_hashpw
except (ImportError, AttributeError):
    pass  # bcrypt not available or already patched

# Now initialize CryptContext - the patched bcrypt will handle long passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def _truncate_password(password: str, max_bytes: int = 72) -> str:
    """
    Safely truncate password to max_bytes, handling UTF-8 encoding correctly.
    This prevents breaking multi-byte characters.
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) <= max_bytes:
        return password
    
    # Truncate to max_bytes, then decode back, removing any incomplete characters
    truncated_bytes = password_bytes[:max_bytes]
    # Remove any trailing bytes that might be part of an incomplete UTF-8 character
    while truncated_bytes and (truncated_bytes[-1] & 0xC0) == 0x80:
        truncated_bytes = truncated_bytes[:-1]
    
    try:
        return truncated_bytes.decode('utf-8')
    except UnicodeDecodeError:
        # Fallback: decode with error handling
        return truncated_bytes.decode('utf-8', errors='ignore')

def get_password_hash(password: str):
    # Truncate password to 72 bytes to handle bcrypt's limit
    # This maintains backward compatibility with existing passwords
    processed_password = _truncate_password(password, max_bytes=72)
    return pwd_context.hash(processed_password)

def verify_password(plain_password: str, hashed_password: str):
    # Truncate password the same way as when hashing
    processed_password = _truncate_password(plain_password, max_bytes=72)
    return pwd_context.verify(processed_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    return email

