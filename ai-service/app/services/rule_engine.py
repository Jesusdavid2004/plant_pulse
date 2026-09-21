from typing import List
from app.models.schemas import CareStep


class RuleBasedEngine:
    DIAGNOSES = {
        "healthy_plant": "The plant appears healthy with vibrant green foliage and no visible signs of stress.",
        "mild_stress": "The plant shows early signs of mild stress. Possible causes include slight underwatering or insufficient light.",
        "moderate_stress": "The plant is experiencing moderate stress. Yellowing leaves and reduced growth indicate nutrient deficiency or irregular watering.",
        "severe_stress": "The plant is under severe stress with significant leaf damage. Immediate intervention is required.",
        "dead_plant": "The plant appears to be in critical condition with extensive tissue damage.",
    }

    PROGNOSIS = {
        "healthy_plant": "With continued care, the plant should maintain its health and continue growing normally.",
        "mild_stress": "If addressed within the next few days, the plant should recover fully within 1-2 weeks.",
        "moderate_stress": "Recovery is possible with consistent care over 2-4 weeks. Monitor closely for changes.",
        "severe_stress": "Recovery is uncertain but possible with aggressive intervention over 4-8 weeks.",
        "dead_plant": "Recovery is unlikely. Consider propagation from any remaining healthy tissue.",
    }

    CARE_PLANS = {
        "healthy_plant": [
            CareStep(step_number=1, title="Maintain Watering Schedule", description="Water consistently when top inch of soil is dry.", frequency="Every 5-7 days"),
            CareStep(step_number=2, title="Provide Adequate Light", description="Ensure 6-8 hours of indirect sunlight daily.", frequency="Daily"),
            CareStep(step_number=3, title="Monthly Fertilizing", description="Apply balanced liquid fertilizer at half strength.", frequency="Monthly"),
            CareStep(step_number=4, title="Check for Pests", description="Inspect leaves for any signs of pests or disease.", frequency="Weekly"),
            CareStep(step_number=5, title="Rotate Plant", description="Rotate the plant for even growth on all sides.", frequency="Weekly"),
        ],
        "mild_stress": [
            CareStep(step_number=1, title="Adjust Watering", description="Check soil moisture and water if dry. Ensure proper drainage.", frequency="Every 3-5 days"),
            CareStep(step_number=2, title="Increase Light Exposure", description="Move to a brighter location with indirect light.", frequency="Immediately"),
            CareStep(step_number=3, title="Light Fertilizing", description="Apply diluted fertilizer to address potential nutrient gaps.", frequency="Every 2 weeks"),
            CareStep(step_number=4, title="Monitor Humidity", description="Maintain humidity above 40% using a pebble tray or humidifier.", frequency="Daily"),
            CareStep(step_number=5, title="Prune Damaged Leaves", description="Remove any yellowing or damaged leaves to redirect energy.", frequency="As needed"),
        ],
        "moderate_stress": [
            CareStep(step_number=1, title="Deep Watering", description="Water thoroughly until it drains from the bottom. Let soil dry slightly between waterings.", frequency="Every 3-4 days"),
            CareStep(step_number=2, title="Relocate for Better Light", description="Move to a spot with bright, indirect sunlight.", frequency="Immediately"),
            CareStep(step_number=3, title="Apply Balanced Fertilizer", description="Use a complete NPK fertilizer to restore nutrients.", frequency="Weekly"),
            CareStep(step_number=4, title="Check Root Health", description="Gently inspect roots for rot. Trim any brown or mushy roots.", frequency="Once now"),
            CareStep(step_number=5, title="Increase Air Circulation", description="Ensure good airflow around the plant to prevent fungal issues.", frequency="Ongoing"),
        ],
        "severe_stress": [
            CareStep(step_number=1, title="Emergency Repotting", description="Repot in fresh, well-draining soil. Remove all dead roots.", frequency="Immediately"),
            CareStep(step_number=2, title="Controlled Watering", description="Water sparingly to avoid root rot while plant recovers.", frequency="Every 2-3 days"),
            CareStep(step_number=3, title="Shade Protection", description="Move to filtered light to reduce stress on weakened plant.", frequency="For 2 weeks"),
            CareStep(step_number=4, title="Foliar Feeding", description="Apply diluted liquid fertilizer directly to leaves.", frequency="Every 3 days"),
            CareStep(step_number=5, title="Daily Monitoring", description="Check plant daily for improvement or further decline.", frequency="Daily"),
        ],
        "dead_plant": [
            CareStep(step_number=1, title="Assess Remaining Tissue", description="Check stems for any green tissue that could be saved.", frequency="Immediately"),
            CareStep(step_number=2, title="Cut Back Dead Material", description="Remove all dead stems and leaves to the base.", frequency="Once now"),
            CareStep(step_number=3, title="Attempt Propagation", description="Try to propagate from any remaining healthy stems.", frequency="Once now"),
            CareStep(step_number=4, title="Reduce Watering", description="Water minimally to prevent root rot in weakened root system.", frequency="Every 5-7 days"),
            CareStep(step_number=5, title="Consider Replacement", description="If no improvement in 2 weeks, consider starting with a new plant.", frequency="After 2 weeks"),
        ],
    }

    @staticmethod
    def get_diagnosis(predicted_class: str) -> str:
        return RuleBasedEngine.DIAGNOSES.get(
            predicted_class, "Unable to determine diagnosis."
        )

    @staticmethod
    def get_prognosis(predicted_class: str) -> str:
        return RuleBasedEngine.PROGNOSIS.get(
            predicted_class, "Unable to determine prognosis."
        )

    @staticmethod
    def get_care_plan(predicted_class: str) -> List[CareStep]:
        return RuleBasedEngine.CARE_PLANS.get(
            predicted_class, RuleBasedEngine.CARE_PLANS["mild_stress"]
        )
