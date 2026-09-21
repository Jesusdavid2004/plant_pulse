import { useTranslation } from 'react-i18next';

type Status = 'healthy' | 'warning' | 'critical';

interface StatusIndicatorProps {
  status: Status;
}

const statusConfig: Record<Status, { color: string; bgColor: string; icon: string }> = {
  healthy: {
    color: 'text-green-800 dark:text-green-200',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '●',
  },
  warning: {
    color: 'text-yellow-800 dark:text-yellow-200',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: '●',
  },
  critical: {
    color: 'text-red-800 dark:text-red-200',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '●',
  },
};

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  const { t } = useTranslation();
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-center mt-4">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color} ${config.bgColor}`}
      >
        <span className="animate-pulse">{config.icon}</span>
        {t(`status.${status}`)}
      </span>
    </div>
  );
};

export default StatusIndicator;
