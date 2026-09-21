import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import PlantDetail from './pages/PlantDetail';
import History from './pages/History';
import Layout from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { PlantProvider } from './store/plantStore';

function App() {
  return (
    <ThemeProvider>
      <PlantProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/plants/:id" element={<PlantDetail />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PlantProvider>
    </ThemeProvider>
  );
}

export default App;
