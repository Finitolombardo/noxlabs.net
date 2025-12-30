import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import Roadmap from './pages/Roadmap';
import Configurator from './pages/Configurator';
import Contact from './pages/Contact';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
