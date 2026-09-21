import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlantStore } from '../store/plantStore';
import Input from './Input';
import Button from './Button';
import DayTracker from './DayTracker';
import Card, { CardHeader, CardBody } from './Card';

interface PlantFormProps {
  onSuccess?: () => void;
}

const PlantForm = ({ onSuccess }: PlantFormProps) => {
  const { t } = useTranslation();
  const { createPlant } = usePlantStore();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [step, setStep] = useState<'info' | 'images'>('info');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validateInfo = (): boolean => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Plant name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateInfo()) {
      setStep('images');
    }
  };

  const handleImagesReady = async (images: any[]) => {
    try {
      await createPlant({
        name,
        species: species || undefined,
        userId: 'temp-user-id',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create plant:', error);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {step === 'info' ? t('dashboard.addPlant') : 'Add Images'}
        </h2>
        <div className="flex gap-2 mt-3">
          <div
            className={`h-1 flex-1 rounded ${
              step === 'info' ? 'bg-green-500' : 'bg-green-500'
            }`}
          />
          <div
            className={`h-1 flex-1 rounded ${
              step === 'images' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        </div>
      </CardHeader>
      <CardBody>
        {step === 'info' ? (
          <div className="space-y-4">
            <Input
              label={t('plant.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="My Monstera"
            />
            <Input
              label={t('plant.species')}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Monstera Deliciosa"
            />
            <div className="flex justify-end">
              <Button onClick={handleNext}>{t('common.save')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DayTracker onImagesReady={handleImagesReady} />
            <div className="flex justify-start">
              <Button variant="secondary" onClick={() => setStep('info')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default PlantForm;
