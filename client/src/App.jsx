import { useState } from 'react';
import Home from './pages/Home.jsx';
import Track from './pages/Track.jsx';
import Stats from './pages/Stats.jsx';

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'track', label: 'Track' },
  { key: 'stats', label: 'Stats' },
];

export default function App() {
  const [tab, setTab] = useState('home');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <nav style={{ borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <span style={{ fontWeight: 500, color: '#fff', fontSize: 15 }}>D/OS</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === t.key ? '#fff' : 'transparent',
                  color: tab === t.key ? '#0a0a0a' : '#888',
                  transition: 'background .15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {tab === 'home' && <Home />}
        {tab === 'track' && <Track />}
        {tab === 'stats' && <Stats />}
      </main>
    </div>
  );
}
