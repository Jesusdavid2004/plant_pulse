import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { PlantProvider } from './store/plantStore';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlantDetail = lazy(() => import('./pages/PlantDetail'));
const History = lazy(() => import('./pages/History'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <PlantProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/plants/:id" element={<PlantDetail />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </PlantProvider>
    </ThemeProvider>
  );
}

export default App;
