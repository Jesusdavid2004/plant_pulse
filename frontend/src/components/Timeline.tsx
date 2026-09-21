interface TimelineDay {
  label: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface TimelineProps {
  days: TimelineDay[];
}

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

const Timeline = ({ days }: TimelineProps) => {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {days.map((day, index) => (
          <div key={day.label} className="flex flex-col items-center relative z-10">
            <div
              className={`w-10 h-10 rounded-full ${statusColors[day.status]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
            >
              {day.score}
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {day.label}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
        <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-green-500 rounded" />
      </div>
    </div>
  );
};

export default Timeline;
