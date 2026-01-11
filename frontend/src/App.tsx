import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { SystemProxy } from './pages/SystemProxy';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/guardian" element={<SystemProxy systemId="guardian" />} />
        <Route path="/visualky" element={<SystemProxy systemId="visualky" />} />
      </Routes>
    </Router>
  );
}

export default App;
