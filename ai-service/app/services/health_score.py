from app.models.schemas import PlantStatus


class HealthScoreCalculator:
    CLASS_SCORES = {
        "healthy_plant": 90,
        "mild_stress": 70,
        "moderate_stress": 45,
        "severe_stress": 25,
        "dead_plant": 5,
    }

    @staticmethod
    def calculate(predicted_class: str, features: dict, confidence: float) -> int:
        base_score = HealthScoreCalculator.CLASS_SCORES.get(predicted_class, 50)

        green_ratio = features.get("green_ratio", 0.3)
        brown_ratio = features.get("brown_ratio", 0)

        green_bonus = min((green_ratio - 0.3) * 50, 10)
        brown_penalty = min(brown_ratio * 80, 20)

        confidence_factor = 0.8 + (confidence * 0.2)

        score = (base_score + green_bonus - brown_penalty) * confidence_factor
        return max(0, min(100, round(score)))

    @staticmethod
    def get_status(score: int) -> PlantStatus:
        if score >= 70:
            return PlantStatus.HEALTHY
        elif score >= 40:
            return PlantStatus.WARNING
        else:
            return PlantStatus.CRITICAL

    @staticmethod
    def calculate_temporal_score(scores: list) -> dict:
        if not scores:
            return {"average": 0, "trend": "unknown"}

        average = sum(scores) / len(scores)

        if len(scores) >= 2:
            change = scores[-1] - scores[0]
        else:
            change = 0

        if change > 5:
            trend = "improving"
        elif change < -5:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "average": round(average),
            "latest": scores[-1],
            "change": change,
            "trend": trend,
        }
