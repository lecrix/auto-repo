import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import db_manager
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AutoRepo API", version="2.0.0")

# Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration with environment-based origins
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []

# Default origins based on environment
if ENVIRONMENT == "production":
    # Production: Only allow WeChat mini program and explicit origins
    default_origins = [
        "https://servicewechat.com",  # WeChat mini program
        "https://servicewechat.com/*",
    ]
    origins = ALLOWED_ORIGINS if ALLOWED_ORIGINS else default_origins
else:
    # Development: Allow all origins
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await db_manager.connect()
    await db_manager.create_indexes()

@app.on_event("shutdown")
async def shutdown_db_client():
    await db_manager.close()

@app.get("/")
async def root():
    return {"message": "AutoRepo Backend is Running"}

@app.get("/api/health")
async def health_check():
    import os
    env = os.getenv("ENVIRONMENT", "not_set")
    jwt_set = bool(os.getenv("JWT_SECRET"))
    jwt_len = len(os.getenv("JWT_SECRET", ""))
    appid_set = bool(os.getenv("WECHAT_APPID"))
    secret_set = bool(os.getenv("WECHAT_SECRET"))
    
    return {
        "status": "ok",
        "environment": env,
        "jwt_secret_configured": jwt_set,
        "jwt_secret_length": jwt_len,
        "wechat_appid_configured": appid_set,
        "wechat_secret_configured": secret_set
    }

from routes import router as api_router
app.include_router(api_router, prefix="/api", tags=["core"])

from auth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
