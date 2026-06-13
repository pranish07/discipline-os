import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/sleep', label: 'Sleep' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/goals', label: 'Goals' },
  { to: '/pmo', label: 'PMO' },
  { to: '/exercise', label: 'Exercise' },
  { to: '/stats', label: 'Stats' },
];

export default function Navigation() {
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
        </div>
      </div>
    </nav>
  );
}
