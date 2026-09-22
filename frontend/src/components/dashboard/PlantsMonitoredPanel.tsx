const PlantsMonitoredPanel = () => {
  return (
    <div className="bg-[var(--color-panel-dark)] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          Plants Monitored
        </h3>
        <p className="text-sm text-gray-400">
          Guides and best practices
        </p>
      </div>

      {/* Audio Wave Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Wave bars */}
        <div className="flex items-center gap-1 h-24">
          {[...Array(40)].map((_, i) => {
            const height = Math.sin(i * 0.3) * 30 + 40;
            return (
              <div
                key={i}
                className="w-1 bg-[var(--color-primary)] rounded-full opacity-80"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full">
          <button className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>||</span>
              <span>1x</span>
              <span className="font-mono">05:34</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantsMonitoredPanel;
