import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { publicApi } from '../../services/endpoints.js';
import { money, monthLabel } from '../../utils/format.js';
import DrawBalls from '../../components/common/DrawBalls.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Badge from '../../components/ui/Badge.jsx';

const LIMIT = 6;

export default function DrawResults() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => publicApi.draws({ page, limit: LIMIT }), [page]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Draw results</h1>
      <p className="mt-2 text-ink-soft">Five numbers are drawn. If your latest five scores contain three, four or five of them, you win a share of that tier.</p>

      <div className="mt-8 space-y-5">
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && data.items.length === 0 && (
          <EmptyState title="No draws published yet" action={<Link to="/subscribe" className="btn btn-primary">Subscribe to take part</Link>}>
            The first draw will appear here as soon as it is published.
          </EmptyState>
        )}
        {data?.items.map((d) => (
          <article key={d.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{d.title}</h2>
                <p className="text-sm text-ink-soft">{monthLabel(d.draw_month)} · {d.logic === 'algorithmic' ? 'Weighted by score frequency' : 'Random draw'}</p>
              </div>
              <Badge tone="indigo">{d.entrants} {d.entrants === 1 ? 'player' : 'players'}</Badge>
            </div>
            <div className="mt-5"><DrawBalls numbers={d.numbers} size="lg" /></div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {[5, 4, 3].map((t) => (
                <div key={t} className="rounded-2xl bg-mist p-4">
                  <dt className="text-sm font-semibold text-ink-soft">{t}-number match</dt>
                  <dd className="mt-1 font-display text-xl font-extrabold">{money(Number(d.tier_pools?.[t] ?? 0))}</dd>
                  <dd className="text-sm text-ink-soft">{d.winners_by_tier?.[t] || 0} {(d.winners_by_tier?.[t] || 0) === 1 ? 'winner' : 'winners'}</dd>
                </div>
              ))}
            </dl>
            {Number(d.jackpot_rollover_out_minor) > 0 && (
              <p className="mt-4 rounded-2xl bg-sun/25 px-4 py-3 text-sm font-semibold">Nobody matched all five. {money(Number(d.jackpot_rollover_out_minor))} rolls over to the next draw.</p>
            )}
          </article>
        ))}
      </div>
      {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
    </div>
  );
}
