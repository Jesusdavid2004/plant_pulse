import Button from './Button';

interface ImagePreviewProps {
  src: string;
  label: string;
  onRemove?: () => void;
  onRetake?: () => void;
}

const ImagePreview = ({ src, label, onRemove, onRetake }: ImagePreviewProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="relative group">
        <img
          src={src}
          alt={label}
          className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
        />
        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onRetake && (
            <Button onClick={onRetake} variant="secondary" size="sm">
              Retake
            </Button>
          )}
          {onRemove && (
            <Button onClick={onRemove} variant="danger" size="sm">
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
