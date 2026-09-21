import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const { t } = useTranslation();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      setIsCameraActive(false);
    }
  }, [onCapture]);

  const retake = () => {
    setIsCameraActive(true);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'environment',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isCameraActive ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="rounded-lg w-full max-w-lg"
          />
          <div className="flex gap-3">
            <Button onClick={capture} variant="primary">
              {t('plant.captureImage')}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="secondary">
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </>
      ) : (
        <Button onClick={retake} variant="outline">
          Retake
        </Button>
      )}
    </div>
  );
};

export default CameraCapture;
