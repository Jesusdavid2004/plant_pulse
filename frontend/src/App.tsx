import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import PlantDetail from './pages/PlantDetail';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plants/:id" element={<PlantDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
