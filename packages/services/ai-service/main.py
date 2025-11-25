import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 1. Import CORSMiddleware
from dotenv import load_dotenv

from app.api import router as api_router

load_dotenv(dotenv_path='../../../.env')

app = FastAPI(
    title="FlowSplit AI Service",
    description="Provides financial insights and recommendations.",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}