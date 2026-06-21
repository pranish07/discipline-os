import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Track from './pages/Track.jsx';
import Stats from './pages/Stats.jsx';
import Login from './pages/Login.jsx';

const tabs = [
  { key: 'home', path: '/home', label: 'Home' },
  { key: 'track', path: '/track', label: 'Track' },
  { key: 'stats', path: '/stats', label: 'Stats' },
];

function isAuthenticated() {
  return !!localStorage.getItem('auth.token');
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const oldKeys = ['dos_sleep','dos_tasks','dos_pmo','dos_exercise','dos_screen','dos_goals','dos_exercise_schedule','dos_cleared'];
    oldKeys.forEach(k => localStorage.removeItem(k));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const authed = isAuthenticated();
    const onLoginPage = location.pathname === '/login' || location.pathname === '/register';

    if (!authed && !onLoginPage) {
      navigate('/login', { replace: true });
    } else if (authed && onLoginPage) {
      navigate('/home', { replace: true });
    }
  }, [ready, location.pathname, navigate]);

  const authed = isAuthenticated();
  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/track')) return 'track';
    if (p.startsWith('/stats')) return 'stats';
    if (p.startsWith('/home') || p === '/') return 'home';
    return null;
  })();

  if (!ready) return null;

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <nav style={{ borderBottom: '1px solid #222', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
          <span style={{ fontWeight: 500, color: '#fff', fontSize: 15 }}>D/OS</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => navigate(t.path)}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: activeTab === t.key ? '#fff' : 'transparent',
                  color: activeTab === t.key ? '#0a0a0a' : '#888',
                  transition: 'background .15s',
                }}
              >
                {t.label}
              </button>
            ))}
            <button onClick={() => { localStorage.removeItem('auth.token'); localStorage.removeItem('auth.refresh_token'); navigate('/login', { replace: true }); }}
              title="Sign out"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #333', background: 'transparent', color: '#555', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/track" element={<Track />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}