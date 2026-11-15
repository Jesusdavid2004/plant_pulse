import sharp from 'sharp';
import type { ImageProcessor, ProcessedImage } from '../../domain/ai/repositories';
import { InvalidImageError } from '../../domain/errors';

const MAX_DIMENSION_PX = 1024;
const OUTPUT_QUALITY = 85;
const MAX_INPUT_PIXELS = 40_000_000;
const OUTPUT_MIME_TYPE = 'image/jpeg';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_MARKER_OFFSET = 8;

function startsWith(buffer: Buffer, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

export function hasSupportedImageSignature(buffer: Buffer): boolean {
  return (
    startsWith(buffer, JPEG_SIGNATURE) ||
    startsWith(buffer, PNG_SIGNATURE) ||
    (startsWith(buffer, RIFF_SIGNATURE) && startsWith(buffer, WEBP_SIGNATURE, WEBP_MARKER_OFFSET))
  );
}

export class SharpImageProcessor implements ImageProcessor {
  async sanitize(input: Buffer): Promise<ProcessedImage> {
    if (!hasSupportedImageSignature(input)) throw new InvalidImageError();

    try {
      const buffer = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .resize({
          width: MAX_DIMENSION_PX,
          height: MAX_DIMENSION_PX,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: OUTPUT_QUALITY })
        .toBuffer();
      return { buffer, mimeType: OUTPUT_MIME_TYPE };
    } catch {
      throw new InvalidImageError();
    }
  }
}
