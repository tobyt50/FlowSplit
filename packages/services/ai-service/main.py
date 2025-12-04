import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api import router as api_router

load_dotenv(dotenv_path='../../../.env')

app = FastAPI(
    title="FlowSplit AI Service",
    description="Provides financial insights and recommendations.",
    version="1.0.0"
)

# Read environment variables (same as NestJS ConfigService)
frontend_url = os.getenv("FRONTEND_URL")        # Example: https://flowsplit.vercel.app
admin_frontend_url = os.getenv("ADMIN_FRONTEND_URL")  # Example: https://admin.flowsplit.vercel.app

# Default local dev origins (like NestJS)
allowed_origins = [
    "http://localhost:3000",   # Local Web
    "http://localhost:3001",   # Local Admin
]

# Append dynamic env-based URLs
if frontend_url:
    allowed_origins.append(frontend_url)

if admin_frontend_url:
    allowed_origins.append(admin_frontend_url)

print("CORS Enabled for:", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
