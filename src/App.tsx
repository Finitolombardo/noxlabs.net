import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import Roadmap from './pages/Roadmap';
import SolutionFinder from './pages/SolutionFinder';
import Contact from './pages/Contact';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="systems" element={<Systems />} />
          <Route path="systems/:slug" element={<SystemDetail />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="solution-finder" element={<SolutionFinder />} />
          <Route path="loesungsfinder" element={<Navigate to="/solution-finder" replace />} />
          <Route path="configurator" element={<Navigate to="/solution-finder" replace />} />
          <Route path="contact" element={<Contact />} />
          <Route path="impressum" element={<Impressum />} />
          <Route path="datenschutz" element={<Datenschutz />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
