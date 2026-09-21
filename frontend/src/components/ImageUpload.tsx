import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

const ImageUpload = ({
  onUpload,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024,
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const validateFile = (file: File): boolean => {
    const allowedTypes = accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type');
      return false;
    }
    if (file.size > maxSize) {
      setError(`File too large (max ${maxSize / 1024 / 1024}MB)`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onUpload(file);
      }
    },
    [onUpload, accept, maxSize]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onUpload(file);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        isDragging
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('plant.uploadImage')}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          JPEG, PNG, WebP up to {maxSize / 1024 / 1024}MB
        </p>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
