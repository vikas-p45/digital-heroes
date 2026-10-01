import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import { publicApi } from '../../services/endpoints.js';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import CharityArt from '../../components/common/CharityArt.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Field.jsx';

const LIMIT = 9;

export default function CharityList() {
  const [q, setQ] = useState('');
  const [featured, setFeatured] = useState(false);
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useAsync(
    () => publicApi.charities({ q: dq, featured: featured ? 'true' : '', page, limit: LIMIT }), [dq, featured, page]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Charities</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">Every member directs part of their subscription to one of these causes. Find one that matters to you.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-sm sm:flex-1">
          <Input type="search" placeholder="Search by name or cause" aria-label="Search charities" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={featured} onChange={(e) => { setFeatured(e.target.checked); setPage(1); }} className="h-4 w-4 accent-[#1D1B4C]" />
          Featured only
        </label>
      </div>

      <div className="mt-8">
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && data.items.length === 0 && <EmptyState title="No charities match your search">Try a different word, or clear the filters.</EmptyState>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((c) => (
            <Link key={c.id} to={`/charities/${c.slug}`} className="card block p-4 transition hover:shadow-lift">
              <CharityArt charity={c} />
              <div className="mt-4 flex items-center gap-2">
                <h2 className="text-lg font-bold">{c.name}</h2>
                {c.featured && <Badge tone="amber">Featured</Badge>}
              </div>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{c.description}</p>
              {c.events?.length > 0 && <p className="mt-3 text-xs font-semibold text-heart">{c.events.length} upcoming {c.events.length === 1 ? 'event' : 'events'}</p>}
            </Link>
          ))}
        </div>
        {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
      </div>
    </div>
  );
}
