from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.models.schemas import AnalysisRequest
from app.services.analysis_service import AnalysisService

load_dotenv()

app = FastAPI(
    title="PlantPulse AI Service",
    description="AI-powered plant health analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analysis_service = AnalysisService()


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "model_loaded": analysis_service.model.model_loaded,
    }


@app.post("/analyze")
async def analyze_plant(request: AnalysisRequest):
    result = await analysis_service.analyze_plant(request.images)
    return result
