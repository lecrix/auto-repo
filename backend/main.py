from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db_manager

app = FastAPI(title="AutoRepo API", version="1.0.0")

# CORS (Allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await db_manager.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    await db_manager.close()

@app.get("/")
async def root():
    return {"message": "AutoRepo Backend is Running"}

from routes import router as api_router
app.include_router(api_router, prefix="/api", tags=["core"])
