from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import io
import base64


class ImagePreprocessor:
    TARGET_SIZE = (224, 224)

    @staticmethod
    def decode_base64_image(image_data: str) -> Image.Image:
        if "," in image_data:
            image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    @staticmethod
    def resize_image(image: Image.Image) -> Image.Image:
        return image.resize(ImagePreprocessor.TARGET_SIZE, Image.LANCZOS)

    @staticmethod
    def normalize_image(image: Image.Image) -> np.ndarray:
        img_array = np.array(image, dtype=np.float32)
        return img_array / 255.0

    @staticmethod
    def enhance_image(image: Image.Image) -> Image.Image:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        return image

    @staticmethod
    def preprocess(image_data: str) -> np.ndarray:
        image = ImagePreprocessor.decode_base64_image(image_data)
        image = ImagePreprocessor.enhance_image(image)
        image = ImagePreprocessor.resize_image(image)
        normalized = ImagePreprocessor.normalize_image(image)
        return np.expand_dims(normalized, axis=0)

    @staticmethod
    def extract_color_features(image_data: str) -> dict:
        image = ImagePreprocessor.decode_base64_image(image_data)
        img_array = np.array(image)

        r_mean = float(np.mean(img_array[:, :, 0]))
        g_mean = float(np.mean(img_array[:, :, 1]))
        b_mean = float(np.mean(img_array[:, :, 2]))

        green_ratio = float(g_mean / (r_mean + g_mean + b_mean + 1e-6))
        brown_ratio = float(
            np.mean(
                (img_array[:, :, 0] > 100)
                & (img_array[:, :, 1] < 100)
                & (img_array[:, :, 2] < 100)
            )
        )

        return {
            "red_mean": r_mean,
            "green_mean": g_mean,
            "blue_mean": b_mean,
            "green_ratio": green_ratio,
            "brown_ratio": brown_ratio,
        }
