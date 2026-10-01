import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-mist'}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const signOut = () => { logout(); close(); navigate('/'); };

  const links = (
    <>
      <NavLink to="/charities" className={linkCls} onClick={close}>Charities</NavLink>
      <NavLink to="/draws" className={linkCls} onClick={close}>Draw results</NavLink>
      {user && <NavLink to="/dashboard" className={linkCls} onClick={close}>Dashboard</NavLink>}
      {isAdmin && <NavLink to="/admin" className={linkCls} onClick={close}>Admin</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold" onClick={close}>
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          Digital Heroes
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">{links}</nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <button onClick={signOut} className="btn btn-ghost btn-sm">Log out</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/subscribe" className="btn btn-sun btn-sm">Subscribe</Link>
            </>
          )}
        </div>

        <button className="rounded-full p-2 hover:bg-mist md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">{links}</nav>
          <div className="mt-3 flex gap-2">
            {user ? (
              <button onClick={signOut} className="btn btn-ghost w-full">Log out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost flex-1" onClick={close}>Log in</Link>
                <Link to="/subscribe" className="btn btn-sun flex-1" onClick={close}>Subscribe</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
