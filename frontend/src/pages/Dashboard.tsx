import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlantStore } from '../store/plantStore';
import Card, { CardBody } from '../components/Card';
import Button from '../components/Button';
import PlantForm from '../components/PlantForm';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, fetchPlants, deletePlant } = usePlantStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handlePlantCreated = () => {
    setShowForm(false);
    fetchPlants();
  };

  if (showForm) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlantForm onSuccess={handlePlantCreated} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.myPlants')}
        </h1>
        <Button onClick={() => setShowForm(true)}>
          {t('dashboard.addPlant')}
        </Button>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      ) : state.plants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('dashboard.noPlants')}
          </p>
          <Button onClick={() => setShowForm(true)}>
            {t('dashboard.addPlant')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.plants.map((plant) => (
            <Card
              key={plant.id}
              onClick={() => navigate(`/plants/${plant.id}`)}
            >
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plant.name}
                    </h3>
                    {plant.species && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plant.species}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {t(`status.${plant.status}`)}
                  </span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(plant.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlant(plant.id);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {state.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
