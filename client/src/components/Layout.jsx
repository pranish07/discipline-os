import { Outlet } from 'react-router-dom';
import Navigation from './Navigation.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
