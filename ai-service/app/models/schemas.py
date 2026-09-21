from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class PlantStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


class DayLabel(str, Enum):
    DAY_1 = "day1"
    DAY_3 = "day3"
    DAY_7 = "day7"


class ImageAnalysis(BaseModel):
    day_label: DayLabel
    image_path: str
    confidence: float
    predicted_class: str
    features: dict


class CareStep(BaseModel):
    step_number: int
    title: str
    description: str
    frequency: str


class AnalysisResult(BaseModel):
    health_score: int
    status: PlantStatus
    diagnosis: str
    prognosis: Optional[str] = None
    care_plan: List[CareStep]
    images_analysis: List[ImageAnalysis]
    temporal_comparison: Optional[dict] = None


class AnalysisRequest(BaseModel):
    plant_id: str
    images: dict


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
