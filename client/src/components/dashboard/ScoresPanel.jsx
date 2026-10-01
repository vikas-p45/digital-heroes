import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import ScoreForm from '../forms/ScoreForm.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const MAX = 5;

/**
 * Score list + add/edit/delete. Generic over `api` ({ add, edit, remove }) so the member
 * dashboard and the admin user editor share exactly the same behaviour.
 * The server returns the fresh list after every change and keeps only the latest five.
 */
export default function ScoresPanel({ scores, canWrite, api, onChange, title = 'Your scores', flat = false }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const Wrapper = flat ? 'div' : Card;

  const run = async (fn, message) => {
    const list = await fn();
    onChange(list);
    if (message) toast.success(message);
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete the score of ${s.score} from ${fmtDate(s.played_on)}?`)) return;
    try { await run(() => api.remove(s.id), 'Score deleted.'); } catch (e) { toast.error(e.message); }
  };

  return (
    <Wrapper>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-sm font-semibold text-ink-soft">{scores.length} of {MAX}</span>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: MAX }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i < scores.length ? 'bg-sun' : 'bg-mist'}`} />
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Your latest five scores enter the draw. Adding a new one replaces the oldest. One score per date.
      </p>

      {!canWrite && (
        <p className="mt-4 rounded-2xl bg-heart-soft px-4 py-3 text-sm text-[#9C2238]">
          An active subscription is needed to add or edit scores.{' '}
          <Link to="/subscribe" className="font-semibold underline">Subscribe</Link>
        </p>
      )}

      {scores.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">No scores yet. Add your first one below.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {scores.map((s) => (
            <li key={s.id} className="p-3.5">
              {editing === s.id ? (
                <ScoreForm initial={s} submitLabel="Save changes" onCancel={() => setEditing(null)}
                  onSubmit={async (body) => { await run(() => api.edit(s.id, body), 'Score updated.'); setEditing(null); }} />
              ) : (
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun font-display text-lg font-extrabold">{s.score}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{fmtDate(s.played_on)}</p>
                    <p className="text-xs text-ink-soft">Stableford points</p>
                  </div>
                  {canWrite && <Button variant="ghost" size="sm" onClick={() => setEditing(s.id)}>Edit</Button>}
                  <Button variant="ghost" size="sm" onClick={() => remove(s)}>Delete</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-3 text-base font-bold">Add a score</h3>
          <ScoreForm onSubmit={(body) => run(() => api.add(body), 'Score added.')} />
        </div>
      )}
    </Wrapper>
  );
}
