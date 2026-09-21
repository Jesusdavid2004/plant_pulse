from app.models.schemas import AnalysisResult, ImageAnalysis, DayLabel
from app.services.model_service import PlantHealthModel
from app.services.rule_engine import RuleBasedEngine
from app.services.temporal_comparator import TemporalComparator
from app.services.health_score import HealthScoreCalculator
from app.services.care_plan_generator import CarePlanGenerator
from typing import Dict


class AnalysisService:
    def __init__(self):
        self.model = PlantHealthModel()

    async def analyze_plant(self, images: Dict[str, str]) -> AnalysisResult:
        day_labels = [DayLabel.DAY_1, DayLabel.DAY_3, DayLabel.DAY_7]
        image_keys = ["day1", "day3", "day7"]
        analyses = []

        for key, day_label in zip(image_keys, day_labels):
            if key in images:
                predicted_class, confidence, features = self.model.predict(
                    images[key]
                )
                analyses.append(
                    {
                        "day_label": day_label,
                        "image_path": key,
                        "confidence": confidence,
                        "predicted_class": predicted_class,
                        "features": features,
                    }
                )

        latest_analysis = analyses[-1] if analyses else analyses[0]
        predicted_class = latest_analysis["predicted_class"]
        confidence = latest_analysis["confidence"]
        features = latest_analysis["features"]

        temporal_comparison = TemporalComparator.compare_images(analyses)

        health_score = HealthScoreCalculator.calculate(
            predicted_class, features, confidence
        )
        status = HealthScoreCalculator.get_status(health_score)

        diagnosis = RuleBasedEngine.get_diagnosis(predicted_class)
        prognosis = RuleBasedEngine.get_prognosis(predicted_class)

        care_plan = CarePlanGenerator.generate(predicted_class, temporal_comparison)

        image_analyses = [
            ImageAnalysis(
                day_label=a["day_label"],
                image_path=a["image_path"],
                confidence=a["confidence"],
                predicted_class=a["predicted_class"],
                features=a["features"],
            )
            for a in analyses
        ]

        return AnalysisResult(
            health_score=health_score,
            status=status,
            diagnosis=diagnosis,
            prognosis=prognosis,
            care_plan=care_plan,
            images_analysis=image_analyses,
            temporal_comparison=temporal_comparison,
        )
