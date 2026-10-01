import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  ['/admin', 'Overview', true],
  ['/admin/users', 'Users'],
  ['/admin/draws', 'Draws'],
  ['/admin/charities', 'Charities'],
  ['/admin/winners', 'Winners'],
];

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Admin</h1>
      <nav className="mt-4 flex gap-1 overflow-x-auto pb-1" aria-label="Admin sections">
        {tabs.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-mist'}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6"><Outlet /></div>
    </div>
  );
}
