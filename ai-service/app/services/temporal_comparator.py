from typing import List, Dict


class TemporalComparator:
    SEVERITY_MAP = {
        "healthy_plant": 0,
        "mild_stress": 1,
        "moderate_stress": 2,
        "severe_stress": 3,
        "dead_plant": 4,
    }

    @staticmethod
    def compare_images(analyses: List[Dict]) -> Dict:
        if len(analyses) < 2:
            return {"trend": "insufficient_data", "change": "N/A"}

        day1 = analyses[0]
        day3 = analyses[1] if len(analyses) > 1 else None
        day7 = analyses[2] if len(analyses) > 2 else None

        day1_severity = TemporalComparator.SEVERITY_MAP.get(
            day1.get("predicted_class", ""), 2
        )
        day3_severity = (
            TemporalComparator.SEVERITY_MAP.get(
                day3.get("predicted_class", ""), 2
            )
            if day3
            else None
        )
        day7_severity = (
            TemporalComparator.SEVERITY_MAP.get(
                day7.get("predicted_class", ""), 2
            )
            if day7
            else None
        )

        trend = TemporalComparator._calculate_trend(
            day1_severity, day3_severity, day7_severity
        )

        green_day1 = day1.get("features", {}).get("green_ratio", 0)
        green_day7 = (
            analyses[-1].get("features", {}).get("green_ratio", 0)
            if analyses
            else green_day1
        )
        green_change = green_day7 - green_day1

        brown_day1 = day1.get("features", {}).get("brown_ratio", 0)
        brown_day7 = (
            analyses[-1].get("features", {}).get("brown_ratio", 0)
            if analyses
            else brown_day1
        )
        brown_change = brown_day7 - brown_day1

        return {
            "trend": trend,
            "severity_progression": [
                day1_severity,
                day3_severity,
                day7_severity,
            ],
            "green_change": round(green_change, 4),
            "brown_change": round(brown_change, 4),
            "day1_class": day1.get("predicted_class"),
            "day3_class": day3.get("predicted_class") if day3 else None,
            "day7_class": day7.get("predicted_class") if day7 else None,
        }

    @staticmethod
    def _calculate_trend(d1: int, d3: int, d7: int) -> str:
        severities = [s for s in [d1, d3, d7] if s is not None]

        if len(severities) < 2:
            return "insufficient_data"

        if all(
            severities[i] >= severities[i + 1]
            for i in range(len(severities) - 1)
        ):
            return "improving"

        if all(
            severities[i] <= severities[i + 1]
            for i in range(len(severities) - 1)
        ):
            return "declining"

        return "stable"
