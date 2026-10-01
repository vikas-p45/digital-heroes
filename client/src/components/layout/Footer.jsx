import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>Digital Heroes. A share of every subscription goes to a charity chosen by the subscriber.</p>
        <nav className="flex gap-4 font-medium" aria-label="Footer">
          <Link to="/charities" className="hover:text-ink">Charities</Link>
          <Link to="/draws" className="hover:text-ink">Draw results</Link>
          <Link to="/subscribe" className="hover:text-ink">Subscribe</Link>
        </nav>
      </div>
    </footer>
  );
}
