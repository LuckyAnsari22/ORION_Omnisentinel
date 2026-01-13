import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { SystemProxy } from './pages/SystemProxy';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { useGlobalKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './styles/global.css';

function AppContent() {
  useGlobalKeyboardShortcuts();

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/guardian" element={<SystemProxy systemId="guardian" />} />
        <Route path="/visualky" element={<SystemProxy systemId="visualky" />} />
      </Routes>
      <AccessibilityPanel />
    </>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <AppContent />
      </Router>
    </AccessibilityProvider>
  );
}

export default App;
