import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { InvalidImageError } from '../../src/domain/errors';
import {
  hasSupportedImageSignature,
  SharpImageProcessor,
} from '../../src/infrastructure/images/SharpImageProcessor';

const LARGE_SIDE_PX = 3000;
const MAX_SIDE_PX = 1024;

async function jpegWithExif(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 120, b: 40 } },
  })
    .withExif({ IFD0: { Copyright: 'secret-gps-owner' } })
    .jpeg()
    .toBuffer();
}

describe('SharpImageProcessor', () => {
  it('accepts JPEG, PNG and WebP by their magic bytes', async () => {
    const base = sharp({ create: { width: 8, height: 8, channels: 3, background: '#2e8b57' } });

    expect(hasSupportedImageSignature(await base.clone().jpeg().toBuffer())).toBe(true);
    expect(hasSupportedImageSignature(await base.clone().png().toBuffer())).toBe(true);
    expect(hasSupportedImageSignature(await base.clone().webp().toBuffer())).toBe(true);
  });

  it('rejects content that only pretends to be an image', async () => {
    const processor = new SharpImageProcessor();

    await expect(processor.sanitize(Buffer.from('GIF89a not supported'))).rejects.toBeInstanceOf(
      InvalidImageError,
    );
    await expect(
      processor.sanitize(Buffer.from('<svg onload="alert(1)"/>')),
    ).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('rejects a file with a valid signature but corrupted content', async () => {
    const corrupted = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(50, 1)]);

    await expect(new SharpImageProcessor().sanitize(corrupted)).rejects.toBeInstanceOf(
      InvalidImageError,
    );
  });

  it('strips EXIF metadata from the stored image', async () => {
    const original = await jpegWithExif(64, 64);
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const processed = await new SharpImageProcessor().sanitize(original);

    expect((await sharp(processed.buffer).metadata()).exif).toBeUndefined();
    expect(processed.mimeType).toBe('image/jpeg');
  });

  it('shrinks large photos to keep AI requests small', async () => {
    const processed = await new SharpImageProcessor().sanitize(
      await jpegWithExif(LARGE_SIDE_PX, LARGE_SIDE_PX),
    );

    const { width, height } = await sharp(processed.buffer).metadata();
    expect(Math.max(width ?? 0, height ?? 0)).toBeLessThanOrEqual(MAX_SIDE_PX);
  });
});
