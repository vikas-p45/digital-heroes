import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-ink-soft">That link does not lead anywhere. Head back to the homepage.</p>
      <Link to="/" className="btn btn-primary mt-6">Go to homepage</Link>
    </div>
  );
}
