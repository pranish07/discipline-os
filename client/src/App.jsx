import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from './api/axios.js';
import { useAuthStore } from './store/authStore.js';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Sleep from './pages/Sleep.jsx';
import Tasks from './pages/Tasks.jsx';
import Goals from './pages/Goals.jsx';
import PMO from './pages/PMO.jsx';
import Exercise from './pages/Exercise.jsx';
import Stats from './pages/Stats.jsx';
import ScreenTime from './pages/ScreenTime.jsx';

export default function App() {
  const { user, loading, setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('auth.token');
    if (!token) {
      setLoading(false);
      return;
    }

    const refreshToken = localStorage.getItem('auth.refresh_token');
    if (!refreshToken) {
      setSession({ access_token: token, user: null });
    } else {
      setSession({ access_token: token, refresh_token: refreshToken, user: null });
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setSession((s) => ({ ...s, user: data.user }));
      })
      .catch(() => {
        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#a0aec0] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/pmo" element={<PMO />} />
          <Route path="/exercise" element={<Exercise />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/screen-time" element={<ScreenTime />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
