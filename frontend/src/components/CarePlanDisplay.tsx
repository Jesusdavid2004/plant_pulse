interface CareStep {
  step_number: number;
  title: string;
  description: string;
  frequency: string;
}

interface CarePlanDisplayProps {
  steps: CareStep[];
}

const CarePlanDisplay = ({ steps }: CarePlanDisplayProps) => {
  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div
          key={step.step_number}
          className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-green-700 dark:text-green-300 font-bold text-sm">
              {step.step_number}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {step.description}
            </p>
            <span className="inline-block mt-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
              {step.frequency}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CarePlanDisplay;
