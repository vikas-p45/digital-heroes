import { Link, useParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { publicApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';
import CharityArt from '../../components/common/CharityArt.jsx';
import DonateForm from '../../components/forms/DonateForm.jsx';
import { fmtDate } from '../../utils/format.js';

export default function CharityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: c, loading, error, reload } = useAsync(() => publicApi.charity(slug), [slug]);

  if (loading) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorNote error={error} onRetry={reload} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link to="/charities" className="text-sm font-semibold text-ink-soft hover:text-ink">Back to charities</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <CharityArt charity={c} className="h-64 sm:h-80" />
          <h1 className="mt-6 text-4xl font-extrabold">{c.name}</h1>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink-soft">{c.description}</p>

          <h2 className="mt-10 text-2xl font-bold">Upcoming events</h2>
          {c.events?.length ? (
            <ul className="mt-4 space-y-3">
              {c.events.map((e, i) => (
                <li key={i} className="card flex flex-wrap items-center justify-between gap-2 p-4 sm:p-4">
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-sm text-ink-soft">{[e.date && fmtDate(e.date), e.location].filter(Boolean).join(' · ')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-ink-soft">No events are scheduled right now.</p>}
        </div>

        <aside className="space-y-5">
          <DonateForm charity={c} />
          {!user && (
            <div className="card bg-mist">
              <h2 className="text-lg font-bold">Give every month</h2>
              <p className="mt-1 text-sm text-ink-soft">Subscribe, choose {c.name}, and a share of your fee goes to them automatically.</p>
              <Link to={`/signup?charity=${c.id}`} className="btn btn-primary mt-4">Subscribe and support</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
