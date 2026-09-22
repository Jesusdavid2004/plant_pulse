import { useState } from 'react';

const GrowthAnalysisPanel = () => {
  const [timeRange, setTimeRange] = useState('Month');

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Growth Analysis
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            1 Month Growth Timeline
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="Week">Week</option>
          <option value="Month">Month</option>
          <option value="Year">Year</option>
        </select>
      </div>

      {/* Chart Area */}
      <div className="relative h-48 bg-[var(--color-surface-hover)] rounded-xl p-4">
        {/* Grid lines */}
        <div className="absolute inset-4 grid grid-rows-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b border-[var(--color-border)] opacity-30" />
          ))}
        </div>

        {/* Chart line */}
        <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" preserveAspectRatio="none">
          <path
            d="M 0 80 Q 50 60, 100 50 T 200 40 T 300 30 T 400 20"
            stroke="var(--color-accent)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Data point marker */}
          <circle
            cx="300"
            cy="30"
            r="6"
            fill="var(--color-accent)"
            className="drop-shadow-lg"
          />
          <text
            x="300"
            y="20"
            fill="var(--color-text)"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
          >
            4:06
          </text>
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>mar</span>
          <span>may</span>
          <span>jun</span>
          <span>jul</span>
          <span>aug</span>
          <span>sep</span>
        </div>
      </div>
    </div>
  );
};

export default GrowthAnalysisPanel;
