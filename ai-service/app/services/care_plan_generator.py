from typing import List
from app.models.schemas import CareStep
from app.services.rule_engine import RuleBasedEngine
from app.services.temporal_comparator import TemporalComparator


class CarePlanGenerator:
    @staticmethod
    def generate(
        predicted_class: str, temporal_data: dict
    ) -> List[CareStep]:
        base_plan = RuleBasedEngine.get_care_plan(predicted_class)

        trend = temporal_data.get("trend", "stable")

        if trend == "improving":
            base_plan = CarePlanGenerator._add_recovery_note(base_plan)
        elif trend == "declining":
            base_plan = CarePlanGenerator._add_urgency_note(base_plan)

        return base_plan[:5]

    @staticmethod
    def _add_recovery_note(plan: List[CareStep]) -> List[CareStep]:
        if plan:
            plan[0] = CareStep(
                step_number=1,
                title="Continue Current Care",
                description=f"{plan[0].description} The plant is showing improvement, maintain this approach.",
                frequency=plan[0].frequency,
            )
        return plan

    @staticmethod
    def _add_urgency_note(plan: List[CareStep]) -> List[CareStep]:
        if plan:
            plan[0] = CareStep(
                step_number=1,
                title="Immediate Action Required",
                description=f"{plan[0].description} The plant is declining, act quickly to prevent further damage.",
                frequency=plan[0].frequency,
            )
        return plan
