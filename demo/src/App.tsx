import { useOmniConsole } from '@omniconsole/react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingView from './views/LandingView';
import DocsView from './views/DocsView';
import PlaygroundView from './views/PlaygroundView';

export default function App() {
  const location = useLocation();
  
  // Initialize OmniConsole (Real floating tool)
  useOmniConsole({
    defaultDock: 'bottom',
    theme: {
      primaryColor: '#e4e4e7',
    },
    blacklistedUrls: [
      'https://telemetry.example.com',
    ],
  });

  const viewClass = location.pathname === '/docs' 
    ? 'docs-view' 
    : location.pathname === '/playground' 
      ? 'playground-view' 
      : 'landing-view';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-300">
      <Header />
      <main className={`main-content ${viewClass} flex-grow`}>
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/docs" element={<DocsView />} />
          <Route path="/playground" element={<PlaygroundView />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
