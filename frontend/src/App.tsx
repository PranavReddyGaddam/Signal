import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import { GTMDashboard } from '@/components/GTMDashboard';
import './index.css';

function App() {
  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      {/* Add Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" 
        rel="stylesheet" 
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<GTMDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
