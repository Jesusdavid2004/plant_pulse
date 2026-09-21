self.addEventListener('message', async (event) => {
  const { imageData, maxWidth, maxHeight, quality } = event.data;

  try {
    const blob = await fetch(imageData).then((r) => r.blob());
    const bitmap = await createImageBitmap(blob);

    const scale = Math.min(
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
      1
    );

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const compressedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality || 0.8,
    });

    const reader = new FileReaderSync();
    const compressedData = reader.readAsDataURL(compressedBlob);

    self.postMessage({ success: true, data: compressedData });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Compression failed',
    });
  }
});
