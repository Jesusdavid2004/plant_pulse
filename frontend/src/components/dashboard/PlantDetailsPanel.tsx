const PlantDetailsPanel = () => {
  const details = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: 'Light Condition',
      value: 'Minimal',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: 'Soil Health',
      value: 'Dry & Cracked',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      label: 'Humidity Level',
      value: '70%',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      label: 'Fertilization Status',
      value: 'Balanced',
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Plant Details
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Real-time conditions:
          </p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)] hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {details.map((detail, index) => (
          <div
            key={index}
            className="bg-[var(--color-surface-hover)] rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="text-[var(--color-primary)]">
              {detail.icon}
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">
                {detail.label}
              </p>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {detail.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlantDetailsPanel;
