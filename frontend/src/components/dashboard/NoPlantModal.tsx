interface NoPlantModalProps {
  onAddPlant: () => void;
}

const NoPlantModal = ({ onAddPlant }: NoPlantModalProps) => {
  return (
    <>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-30 flex items-center justify-center">
        {/* Modal Card */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 max-w-sm w-full mx-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            {/* Cloud Upload Icon */}
            <div className="w-20 h-20 bg-[var(--color-surface-hover)] rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-[var(--color-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {/* Text */}
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
              NO PLANT UPLOADED YET
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Add your first plant to start monitoring
            </p>

            {/* Add Plant Button */}
            <button
              onClick={onAddPlant}
              className="w-full bg-[var(--color-sidebar)] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Add Plant
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoPlantModal;
