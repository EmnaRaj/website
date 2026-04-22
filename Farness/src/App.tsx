import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import HomePage from './pages/HomePage';
import AIAgentsPage from './pages/AIAgentsPage';
import TechnologyPage from './pages/TechnologyPage';
import IndustriesPage from './pages/IndustriesPage';
import PlatformPage from './pages/PlatformPage';
import StatsPage from './pages/StatsPage';
import MouseFollowGlow from './components/MouseFollowGlow';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <ScrollToTop />
          <MouseFollowGlow />
          <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/ai-agents" element={<AIAgentsPage />} />
              <Route path="/technology" element={<TechnologyPage />} />
              <Route path="/industries" element={<IndustriesPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </div>
        </ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
}
