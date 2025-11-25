import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt  # PyJWT
from jwt.exceptions import PyJWTError  # <--- CHANGED: This is the correct exception for PyJWT
from pydantic import BaseModel

# ------------------------------------------------------------------
# Pydantic model for the authenticated user
# ------------------------------------------------------------------
class User(BaseModel):
    id: str


# ------------------------------------------------------------------
# Config & security
# ------------------------------------------------------------------
security = HTTPBearer()

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    # Fallback for local dev if env var isn't loaded perfectly yet, 
    # though dotenv should handle it.
    print("WARNING: JWT_SECRET not found in env, verify your .env loading.")
    
ALGORITHM = "HS256"

# ------------------------------------------------------------------
# Dependency – inject this into any protected route
# ------------------------------------------------------------------
async def get_current_user(token: str = Depends(security)) -> User:
    """
    Validate JWT from Authorization header and return the authenticated User.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not SECRET_KEY:
         raise HTTPException(status_code=500, detail="Server misconfiguration: JWT_SECRET missing")

    try:
        # PyJWT decode
        payload = jwt.decode(
            token.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            # 'require' options ensure these claims exist
            options={"require": ["exp", "sub"]} 
        )
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        return User(id=user_id)

    except PyJWTError as exc: # <--- CHANGED: Catch PyJWTError
        # Covers ExpiredSignatureError, InvalidTokenError, etc.
        print(f"JWT Validation Error: {exc}") # Helpful for debugging
        raise credentials_exception from exc