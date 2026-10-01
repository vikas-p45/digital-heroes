import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { publicApi } from '../../services/endpoints.js';
import { money, monthLabel } from '../../utils/format.js';
import SplitVisualizer from './SplitVisualizer.jsx';
import DrawBalls from '../../components/common/DrawBalls.jsx';
import CharityArt from '../../components/common/CharityArt.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

const STEPS = [
  ['Subscribe and pick a charity', 'Choose monthly or yearly. At least 10% of your fee goes to the cause you pick, and you can raise it whenever you like.'],
  ['Log your last five scores', 'Enter Stableford scores between 1 and 45. We keep your latest five and drop the oldest when you add a new one.'],
  ['Get entered in the monthly draw', 'Five numbers are drawn. Match three, four or five of your scores to win a share of the prize pool.'],
];

export default function Home() {
  const cfg = useAsync(publicApi.config, []);
  const featured = useAsync(() => publicApi.charities({ featured: 'true', limit: 3 }), []);
  const draws = useAsync(() => publicApi.draws({ limit: 1 }), []);
  const latest = draws.data?.items?.[0];

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Log your scores. Win the draw. Fund a cause you choose.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Digital Heroes turns your rounds into monthly prize draws and steady giving. Every subscriber directs part of their fee to a charity they care about.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/subscribe" className="btn btn-sun btn-lg">Subscribe and start giving</Link>
            <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          {cfg.data && (
            <p className="mt-6 text-sm text-ink-soft">
              <strong className="text-ink">{money(cfg.data.projectedPool)}</strong> is in this month's prize pool from{' '}
              <strong className="text-ink">{cfg.data.activeSubscribers}</strong> active {cfg.data.activeSubscribers === 1 ? 'member' : 'members'}.
            </p>
          )}
        </div>
        <div>
          {cfg.loading && <Spinner />}
          {cfg.error && <ErrorNote error={cfg.error} onRetry={cfg.reload} />}
          {cfg.data && <SplitVisualizer config={cfg.data} />}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-3xl font-extrabold">How it works</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-extrabold text-white">{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-3xl font-extrabold">How prizes are split</h2>
            <p className="mt-2 text-ink-soft">The pool is shared by how many of your scores match the drawn numbers. Winners in the same tier split that tier equally.</p>
            {cfg.data && (
              <div className="table-wrap mt-5">
                <table className="table">
                  <thead><tr><th>Match</th><th>Share of pool</th><th>If nobody wins</th></tr></thead>
                  <tbody>
                    {[5, 4, 3].map((t) => (
                      <tr key={t}>
                        <td className="font-semibold">{t} numbers</td>
                        <td>{cfg.data.tierShares[t]}%</td>
                        <td>{t === 5 ? 'Jackpot rolls over to next draw' : 'Stays with the platform'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card flex flex-col justify-between bg-ink text-white">
            <div>
              <h2 className="text-3xl font-extrabold">Latest draw</h2>
              {latest ? (
                <>
                  <p className="mt-2 text-white/70">{latest.title} · {monthLabel(latest.draw_month)}</p>
                  <div className="mt-5"><DrawBalls numbers={latest.numbers} size="lg" /></div>
                  <p className="mt-5 text-white/80">Prize pool {money(Number(latest.pool_total_minor))}. {latest.entrants} {latest.entrants === 1 ? 'player' : 'players'} entered.</p>
                </>
              ) : (
                <p className="mt-2 text-white/70">No draw has been published yet. The first one lands at the end of the month.</p>
              )}
            </div>
            <Link to="/draws" className="btn btn-sun mt-6 self-start">See all results</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold">Causes you can back</h2>
            <p className="mt-2 max-w-xl text-ink-soft">Pick one at signup. Change it whenever you want.</p>
          </div>
          <Link to="/charities" className="btn btn-ghost btn-sm hidden sm:inline-flex">Browse all charities</Link>
        </div>
        {featured.loading && <Spinner />}
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {featured.data?.items.map((c) => (
            <Link key={c.id} to={`/charities/${c.slug}`} className="card group block p-4 transition hover:shadow-lift">
              <CharityArt charity={c} className="h-36" />
              <h3 className="mt-4 text-lg font-bold">{c.name}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-[2rem] bg-heart p-8 text-white sm:p-12">
          <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Your next round can help someone else's week.</h2>
          <Link to="/subscribe" className="btn btn-sun btn-lg mt-6">Subscribe now</Link>
        </div>
      </section>
    </>
  );
}
