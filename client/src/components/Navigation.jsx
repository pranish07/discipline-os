import { NavLink } from 'react-router-dom';
import { useYearStore } from '../store/yearStore.js';

const links = [
  { to: '/', label: 'Home' },
  { to: '/sleep', label: 'Sleep' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/goals', label: 'Goals' },
  { to: '/pmo', label: 'PMO' },
  { to: '/exercise', label: 'Exercise' },
  { to: '/screen-time', label: 'Screen' },
  { to: '/stats', label: 'Stats' },
];

export default function Navigation() {
  const year = useYearStore((s) => s.year);
  const setYear = useYearStore((s) => s.setYear);
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2024; y--) {
    years.push(y);
  }

  return (
    <nav className="border-b border-[#2d2d2d] bg-[#0a0a0a] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
        <div className="flex items-center gap-1">
          <span className="text-white font-bold tracking-tight">D/OS</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-[#a0aec0] hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="ml-2 px-2 py-1 text-xs bg-[#1a1a1a] text-[#a0aec0] border border-[#2d2d2d] rounded cursor-pointer hover:text-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
