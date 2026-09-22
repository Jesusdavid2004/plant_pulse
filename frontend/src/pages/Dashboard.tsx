import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePlantStore } from '../store/plantStore';
import Header from '../components/dashboard/Header';
import Sidebar from '../components/dashboard/Sidebar';
import PlantDisplay from '../components/dashboard/PlantDisplay';
import GrowthAnalysisPanel from '../components/dashboard/GrowthAnalysisPanel';
import PlantDetailsPanel from '../components/dashboard/PlantDetailsPanel';
import PlantsMonitoredPanel from '../components/dashboard/PlantsMonitoredPanel';
import NoPlantModal from '../components/dashboard/NoPlantModal';

const Dashboard = () => {
  const { t } = useTranslation();
  const { state } = usePlantStore();
  const [activeNav, setActiveNav] = useState('my-plant');
  const [showUploadModal, setShowUploadModal] = useState(true);

  const hasPlant = state.plants.length > 0 && !showUploadModal;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <Header 
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Central Plant Area */}
            <div className="col-span-5 relative">
              <PlantDisplay />
              
              {/* Overlay with Upload Modal */}
              {!hasPlant && (
                <NoPlantModal onAddPlant={() => setShowUploadModal(false)} />
              )}
            </div>

            {/* Right Side Panels */}
            <div className="col-span-4 space-y-6">
              <GrowthAnalysisPanel />
              <PlantDetailsPanel />
            </div>

            <div className="col-span-3">
              <PlantsMonitoredPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
