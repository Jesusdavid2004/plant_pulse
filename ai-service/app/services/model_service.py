import numpy as np
from typing import Tuple
from app.utils.preprocessing import ImagePreprocessor


class PlantHealthModel:
    PLANT_CLASSES = {
        0: "healthy_plant",
        1: "mild_stress",
        2: "moderate_stress",
        3: "severe_stress",
        4: "dead_plant",
    }

    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            import tensorflow as tf
            self.model = tf.keras.applications.MobileNetV2(
                weights="imagenet",
                include_top=True,
                input_shape=(224, 224, 3),
            )
            self.model_loaded = True
        except Exception:
            self.model_loaded = False

    def predict(self, image_data: str) -> Tuple[str, float, dict]:
        preprocessed = ImagePreprocessor.preprocess(image_data)
        color_features = ImagePreprocessor.extract_color_features(image_data)

        if self.model_loaded and self.model is not None:
            predictions = self.model.predict(preprocessed, verbose=0)
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][class_idx])
        else:
            class_idx, confidence = self._rule_based_prediction(color_features)

        predicted_class = self.PLANT_CLASSES.get(class_idx, "unknown")
        features = {
            **color_features,
            "model_confidence": confidence,
        }

        return predicted_class, confidence, features

    def _rule_based_prediction(self, features: dict) -> Tuple[int, float]:
        green_ratio = features["green_ratio"]
        brown_ratio = features["brown_ratio"]

        if green_ratio > 0.38 and brown_ratio < 0.05:
            return 0, 0.85
        elif green_ratio > 0.33 and brown_ratio < 0.10:
            return 1, 0.75
        elif green_ratio > 0.28 and brown_ratio < 0.20:
            return 2, 0.70
        elif green_ratio > 0.20:
            return 3, 0.65
        else:
            return 4, 0.60
