import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from './CameraCapture';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import Button from './Button';

interface DayImage {
  dayLabel: string;
  imageData: string | null;
}

interface DayTrackerProps {
  onImagesReady: (images: DayImage[]) => void;
}

const DayTracker = ({ onImagesReady }: DayTrackerProps) => {
  const { t } = useTranslation();
  const [days, setDays] = useState<DayImage[]>([
    { dayLabel: 'Day 1', imageData: null },
    { dayLabel: 'Day 3', imageData: null },
    { dayLabel: 'Day 7', imageData: null },
  ]);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | null>(null);

  const handleCapture = (imageData: string) => {
    if (activeDay === null) return;
    const updated = [...days];
    updated[activeDay].imageData = imageData;
    setDays(updated);
    setActiveDay(null);
    setInputMode(null);
  };

  const handleUpload = (file: File) => {
    if (activeDay === null) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...days];
      updated[activeDay].imageData = e.target?.result as string;
      setDays(updated);
      setActiveDay(null);
      setInputMode(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (index: number) => {
    const updated = [...days];
    updated[index].imageData = null;
    setDays(updated);
  };

  const allImagesReady = days.every((d) => d.imageData !== null);

  const handleSubmit = () => {
    if (allImagesReady) {
      onImagesReady(days);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {days.map((day, index) => (
          <div key={day.dayLabel} className="flex flex-col items-center">
            {day.imageData ? (
              <ImagePreview
                src={day.imageData}
                label={t(`plant.day${index === 0 ? '1' : index === 1 ? '3' : '7'}`)}
                onRemove={() => handleRemove(index)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t(`plant.day${index === 0 ? '1' : index === 1 ? '3' : '7'}`)}
                </span>
                <div className="w-48 h-48 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveDay(index);
                        setInputMode('camera');
                      }}
                    >
                      Camera
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveDay(index);
                        setInputMode('upload');
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {activeDay !== null && inputMode === 'camera' && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => {
            setActiveDay(null);
            setInputMode(null);
          }}
        />
      )}

      {activeDay !== null && inputMode === 'upload' && (
        <div className="max-w-md mx-auto">
          <ImageUpload onUpload={handleUpload} />
        </div>
      )}

      {allImagesReady && (
        <div className="flex justify-center">
          <Button onClick={handleSubmit} size="lg">
            {t('plant.analyze')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DayTracker;
