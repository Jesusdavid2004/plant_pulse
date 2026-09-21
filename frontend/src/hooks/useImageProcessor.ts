import { useState, useCallback } from 'react';
import ImageWorker from '../workers/imageProcessor.worker.ts?worker';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const useImageProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = useCallback(
    (imageData: string, options: CompressionOptions = {}): Promise<string> => {
      return new Promise((resolve, reject) => {
        setProcessing(true);
        setError(null);

        const worker = new ImageWorker();

        worker.onmessage = (event) => {
          setProcessing(false);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            setError(event.data.error);
            reject(new Error(event.data.error));
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
          setProcessing(false);
          setError(err.message);
          reject(err);
          worker.terminate();
        };

        worker.postMessage({
          imageData,
          maxWidth: options.maxWidth || 1024,
          maxHeight: options.maxHeight || 1024,
          quality: options.quality || 0.8,
        });
      });
    },
    []
  );

  return { compressImage, processing, error };
};
