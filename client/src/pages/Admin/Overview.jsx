import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { adminApi } from '../../services/endpoints.js';
import { money } from '../../utils/format.js';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

function Stat({ label, value, sub, tone = 'bg-white' }) {
  return (
    <div className={`rounded-3xl border border-line p-5 ${tone}`}>
      <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-extrabold">{value}</dd>
      {sub && <dd className="mt-1 text-sm text-ink-soft">{sub}</dd>}
    </div>
  );
}

export default function Overview() {
  const { data: r, loading, error, reload } = useAsync(adminApi.reports, []);
  if (loading && !r) return <Spinner />;
  if (error) return <ErrorNote error={error} onRetry={reload} />;

  return (
    <div className="space-y-8">
      {r.proofs_waiting > 0 && (
        <Link to="/admin/winners" className="block rounded-2xl bg-sun/30 px-5 py-4 font-semibold hover:bg-sun/50">
          {r.proofs_waiting} winner {r.proofs_waiting === 1 ? 'proof is' : 'proofs are'} waiting for review. Review now
        </Link>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={r.total_users} />
        <Stat label="Active subscribers" value={r.active_subscribers} />
        <Stat label="Pool this month (projected)" value={money(r.projected_pool)} tone="bg-sun/25" />
        <Stat label="Jackpot rolling over" value={money(r.jackpot_rolling_over)} />
        <Stat label="Prize pool, all published draws" value={money(r.prize_pool_published)} />
        <Stat label="Raised for charities" value={money(r.charity_from_subscriptions + r.charity_from_donations)}
          sub={`${money(r.charity_from_subscriptions)} subscriptions · ${money(r.charity_from_donations)} donations`} tone="bg-heart-soft" />
        <Stat label="Draws" value={`${r.draws_published} / ${r.draws_total}`} sub="published / total" />
        <Stat label="Payouts" value={money(r.paid_out)} sub={`${money(r.payout_pending)} pending · ${r.winners_total} winners`} />
      </dl>

      <section>
        <h2 className="text-2xl font-bold">Charity contributions</h2>
        <div className="table-wrap mt-4">
          <table className="table">
            <thead><tr><th>Charity</th><th>Supporters</th><th>From subscriptions</th><th>Direct donations</th><th>Total</th></tr></thead>
            <tbody>
              {r.charities.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">{c.name}</td>
                  <td>{c.supporters}</td>
                  <td>{money(c.subscriptions_minor)}</td>
                  <td>{money(c.donations_minor)}</td>
                  <td className="font-semibold">{money(c.subscriptions_minor + c.donations_minor)}</td>
                </tr>
              ))}
              {r.charities.length === 0 && <tr><td colSpan="5" className="text-center text-ink-soft">No charities yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
