import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlantStore } from '../store/plantStore';
import Card, { CardBody } from '../components/Card';

const History = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, fetchPlants } = usePlantStore();

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Plant History
      </h1>

      {state.loading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      ) : state.plants.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          No history available.
        </p>
      ) : (
        <div className="space-y-4">
          {state.plants
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((plant) => (
              <Card key={plant.id} onClick={() => navigate(`/plants/${plant.id}`)}>
                <CardBody>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plant.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plant.species || 'Unknown species'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {t(`status.${plant.status}`)}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(plant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default History;
