import os
from datetime import datetime, timedelta
from typing import Optional
import httpx
import jwt
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
WECHAT_APPID = os.getenv("WECHAT_APPID", "")
WECHAT_SECRET = os.getenv("WECHAT_SECRET", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")

if not JWT_SECRET:
    if ENVIRONMENT == "production":
        raise RuntimeError("JWT_SECRET environment variable is required in production")
    JWT_SECRET = "dev-secret-key-insecure-do-not-use-in-production"

if len(JWT_SECRET) < 32:
    if ENVIRONMENT == "production":
        raise RuntimeError("JWT_SECRET must be at least 32 characters for security")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7


class LoginRequest(BaseModel):
    code: str


async def wechat_code_to_session(code: str) -> dict:
    if not WECHAT_APPID or not WECHAT_SECRET:
        if ENVIRONMENT == "production":
            raise HTTPException(
                status_code=500,
                detail="WeChat credentials not configured on server"
            )
        print(f"DEV MODE: Mocking WeChat login for code: {code}")
        return {
            "openid": "mock_user_openid_12345",  # Fixed openid for dev consistency
            "session_key": "mock_session_key",
            "unionid": "mock_unionid"
        }

    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": WECHAT_APPID,
        "secret": WECHAT_SECRET,
        "js_code": code,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        data = response.json()
    
    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(
            status_code=400,
            detail=f"WeChat login failed: {data.get('errmsg', 'Unknown error')}"
        )
    
    return data


def create_access_token(openid: str) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)
    to_encode = {"openid": openid, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    openid = payload.get("openid")
    
    if not openid:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return openid


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, login_req: LoginRequest):
    """
    WeChat Mini Program login endpoint.
    Exchanges WeChat auth code for JWT token.
    Rate limited to 5 requests per minute per IP.
    """
    data = await wechat_code_to_session(login_req.code)
    openid = data["openid"]
    token = create_access_token(openid)
    return {"token": token, "openid": openid}
