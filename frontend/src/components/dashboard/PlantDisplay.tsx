const PlantDisplay = () => {
  return (
    <div className="h-full bg-[var(--color-surface)] rounded-2xl p-8 relative overflow-hidden">
      {/* Plant Info */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
          Bird of Paradise Plant
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Lush, glossy, tropical green leaves.
        </p>
      </div>

      {/* Plant Visual Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Radial background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at center, var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* Floating leaves */}
        <div className="absolute left-20 top-1/2 -translate-y-1/2 flex gap-4">
          <div className="w-32 h-48 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] rounded-full opacity-60 blur-sm" />
          <div className="w-28 h-44 bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] rounded-full opacity-50 blur-sm -mt-8" />
        </div>

        {/* Plant pot placeholder */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-48 h-64 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-success)] rounded-t-full" />
          <div className="w-40 h-32 bg-[var(--color-accent)] rounded-b-lg -mt-4" />
        </div>
      </div>

      {/* Data Points */}
      <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-4 z-20">
        <div className="bg-[var(--color-surface-hover)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Chi B level</p>
          <p className="text-lg font-semibold text-[var(--color-text)]">0.738</p>
          <p className="text-xs text-[var(--color-text-secondary)]">0.02b</p>
        </div>
        <div className="bg-[var(--color-surface-hover)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Chi B level</p>
          <p className="text-lg font-semibold text-[var(--color-text)]">0.738</p>
          <p className="text-xs text-[var(--color-text-secondary)]">:0.02b</p>
        </div>
        <div className="bg-[var(--color-surface-hover)] rounded-xl p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Chi A level</p>
          <p className="text-lg font-semibold text-[var(--color-text)]">0.738</p>
          <p className="text-xs text-[var(--color-text-secondary)]">:0.2b</p>
        </div>
      </div>
    </div>
  );
};

export default PlantDisplay;
