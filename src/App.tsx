import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import Roadmap from './pages/Roadmap';
import Configurator from './pages/Configurator';
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
          <Route path="configurator" element={<Configurator />} />
          <Route path="contact" element={<Contact />} />
          <Route path="impressum" element={<Impressum />} />
          <Route path="datenschutz" element={<Datenschutz />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
