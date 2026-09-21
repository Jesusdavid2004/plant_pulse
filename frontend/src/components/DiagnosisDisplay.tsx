import { useTranslation } from 'react-i18next';

interface DiagnosisDisplayProps {
  diagnosis: string;
  prognosis?: string;
}

const DiagnosisDisplay = ({ diagnosis, prognosis }: DiagnosisDisplayProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {t('plant.diagnosis')}
        </h3>
        <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
          {diagnosis}
        </p>
      </div>
      {prognosis && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t('plant.prognosis')}
          </h3>
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
            {prognosis}
          </p>
        </div>
      )}
    </div>
  );
};

export default DiagnosisDisplay;
