import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlantStore } from '../store/plantStore';
import Card, { CardHeader, CardBody } from '../components/Card';
import Button from '../components/Button';
import HealthScoreCircle from '../components/HealthScoreCircle';
import StatusIndicator from '../components/StatusIndicator';
import Timeline from '../components/Timeline';
import DiagnosisDisplay from '../components/DiagnosisDisplay';
import CarePlanDisplay from '../components/CarePlanDisplay';

const PlantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { state, fetchPlant } = usePlantStore();

  useEffect(() => {
    if (id) {
      fetchPlant(id);
    }
  }, [id, fetchPlant]);

  const plant = state.selectedPlant;

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Plant not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {plant.name}
        </h1>
        {plant.species && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">{plant.species}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('plant.healthScore')}
            </h2>
          </CardHeader>
          <CardBody>
            <HealthScoreCircle score={75} />
            <StatusIndicator status="healthy" />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Timeline
            </h2>
          </CardHeader>
          <CardBody>
            <Timeline
              days={[
                { label: t('plant.day1'), score: 80, status: 'healthy' },
                { label: t('plant.day3'), score: 72, status: 'warning' },
                { label: t('plant.day7'), score: 75, status: 'healthy' },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('plant.diagnosis')}
            </h2>
          </CardHeader>
          <CardBody>
            <DiagnosisDisplay
              diagnosis="The plant appears healthy with vibrant green foliage."
              prognosis="With continued care, the plant should maintain its health."
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('plant.carePlan')}
            </h2>
          </CardHeader>
          <CardBody>
            <CarePlanDisplay
              steps={[
                { step_number: 1, title: 'Maintain Watering', description: 'Water when top inch is dry.', frequency: 'Every 5-7 days' },
                { step_number: 2, title: 'Adequate Light', description: 'Ensure 6-8 hours of indirect sunlight.', frequency: 'Daily' },
                { step_number: 3, title: 'Monthly Fertilizing', description: 'Apply balanced fertilizer.', frequency: 'Monthly' },
                { step_number: 4, title: 'Check for Pests', description: 'Inspect leaves regularly.', frequency: 'Weekly' },
                { step_number: 5, title: 'Rotate Plant', description: 'Rotate for even growth.', frequency: 'Weekly' },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PlantDetail;
