import { useState } from 'react';
import useAsync from '../../hooks/useAsync.js';
import { adminApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDate, money, monthLabel } from '../../utils/format.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field, { Input, Select } from '../../components/ui/Field.jsx';
import DrawBalls from '../../components/common/DrawBalls.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

const LIMIT = 8;
const thisMonth = () => new Date().toISOString().slice(0, 7);

function SettingsCard() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(adminApi.settings, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (data && !form) {
    setForm({ poolPercent: data.poolPercent, t5: data.tierShares[5], t4: data.tierShares[4], t3: data.tierShares[3] });
    return null;
  }
  if (error) return <Card><ErrorNote error={error} onRetry={reload} /></Card>;
  if (!form) return <Card><Spinner /></Card>;

  const sum = Number(form.t5) + Number(form.t4) + Number(form.t3);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.saveSettings({ poolPercent: Number(form.poolPercent), tierShares: { 5: Number(form.t5), 4: Number(form.t4), 3: Number(form.t3) } });
      toast.success('Draw settings saved. They apply to the next simulation and publish.');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold">Prize pool settings</h2>
      <p className="mt-1 text-sm text-ink-soft">Percentages are stored in the database, so you can change them without a redeploy.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Field label="Pool % of each fee"><Input type="number" min="1" max="100" value={form.poolPercent} onChange={set('poolPercent')} /></Field>
        <Field label="5-match share %"><Input type="number" min="0" max="100" value={form.t5} onChange={set('t5')} /></Field>
        <Field label="4-match share %"><Input type="number" min="0" max="100" value={form.t4} onChange={set('t4')} /></Field>
        <Field label="3-match share %"><Input type="number" min="0" max="100" value={form.t3} onChange={set('t3')} /></Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} loading={busy} disabled={Math.round(sum * 100) !== 10000}>Save settings</Button>
        <span className={`text-sm font-semibold ${Math.round(sum * 100) === 10000 ? 'text-sea' : 'text-[#C2324A]'}`}>Tier shares total {sum}%{Math.round(sum * 100) === 10000 ? '' : ' (must be 100%)'}</span>
      </div>
    </Card>
  );
}

function SimulationModal({ draw, onClose, onPublished }) {
  const toast = useToast();
  const [logic, setLogic] = useState(draw.logic);
  const sim = useAsync(() => adminApi.simulate(draw.id, { logic }), [draw.id]);
  const [busy, setBusy] = useState(false);
  const r = sim.data;

  const rerun = () => sim.reload();
  const publish = async () => {
    if (!window.confirm('Publish this draw? Numbers, winners and prizes become final and visible to everyone.')) return;
    setBusy(true);
    try {
      await adminApi.publish(draw.id, { numbers: r.numbers, logic: r.logic });
      toast.success('Draw published. Winners can now upload proof.');
      onPublished(); onClose();
    } catch (e) { toast.error(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Simulate: ${draw.title}`} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Draw logic" className="w-60">
          <Select value={logic} onChange={(e) => setLogic(e.target.value)}>
            <option value="random">Random (lottery style)</option>
            <option value="algorithmic">Algorithmic (weighted by score frequency)</option>
          </Select>
        </Field>
        <Button variant="ghost" onClick={rerun} loading={sim.loading}>Run simulation again</Button>
      </div>
      <p className="mb-4 rounded-2xl bg-mist px-4 py-3 text-sm text-ink-soft">This is a dry run. Nothing is saved or shown to members until you publish.</p>

      {sim.loading && !r && <Spinner label="Running simulation" />}
      <ErrorNote error={sim.error} onRetry={sim.reload} />
      {r && (
        <div className="space-y-5">
          <div><h3 className="mb-2 font-bold">Drawn numbers</h3><DrawBalls numbers={r.numbers} size="lg" /></div>
          <dl className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-ink-soft">Active subscribers</dt><dd className="font-display text-xl font-extrabold">{r.activeSubscribers}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-ink-soft">Eligible entrants</dt><dd className="font-display text-xl font-extrabold">{r.eligibleEntrants}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-ink-soft">Pool</dt><dd className="font-display text-xl font-extrabold">{money(r.poolTotal)}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-ink-soft">Rollover in</dt><dd className="font-display text-xl font-extrabold">{money(r.rolloverIn)}</dd></div>
          </dl>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tier</th><th>Tier pool</th><th>Winners</th><th>Each wins</th></tr></thead>
              <tbody>
                {[5, 4, 3].map((t) => (
                  <tr key={t}><td className="font-semibold">{t}-number match</td><td>{money(r.tierSummary[t].pool)}</td><td>{r.tierSummary[t].winners}</td><td>{r.tierSummary[t].winners ? money(r.tierSummary[t].prizeEach) : '-'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.rolloverOut > 0 && <p className="rounded-2xl bg-sun/25 px-4 py-3 text-sm font-semibold">No 5-number winner: {money(r.rolloverOut)} would roll over to the next draw.</p>}
          {r.winners.length > 0 && (
            <div>
              <h3 className="mb-2 font-bold">Winners</h3>
              <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
                {r.winners.map((w) => (
                  <li key={`${w.userId}-${w.tier}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span><span className="font-semibold">{w.name}</span> <span className="text-ink-soft">{w.email}</span></span>
                    <span className="font-semibold">{w.tier} matches · {money(w.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button variant="sun" loading={busy} onClick={publish}>Publish these results</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminDraws() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => adminApi.draws({ page, limit: LIMIT }), [page]);
  const [form, setForm] = useState({ title: '', month: thisMonth(), logic: 'random' });
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const title = form.title.trim() || `${monthLabel(`${form.month}-01`)} draw`;
      await adminApi.createDraw({ title, draw_month: `${form.month}-01`, logic: form.logic });
      toast.success('Draft draw created.'); setForm({ ...form, title: '' }); setPage(1); reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete the draft "${d.title}"?`)) return;
    try { await adminApi.deleteDraw(d.id); toast.success('Draft deleted.'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <SettingsCard />

      <Card>
        <h2 className="text-xl font-bold">Create a draw</h2>
        <p className="mt-1 text-sm text-ink-soft">You can run more than one draw in the same month.</p>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_1.2fr_auto] sm:items-end">
          <Field label="Title"><Input placeholder="e.g. October draw" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Month"><Input type="month" required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>
          <Field label="Logic">
            <Select value={form.logic} onChange={(e) => setForm({ ...form, logic: e.target.value })}>
              <option value="random">Random</option><option value="algorithmic">Algorithmic</option>
            </Select>
          </Field>
          <Button type="submit" loading={busy}>Create draft</Button>
        </form>
      </Card>

      <div>
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Draw</th><th>Status</th><th>Numbers</th><th>Pool</th><th>Winners</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.items.map((d) => (
                  <tr key={d.id}>
                    <td><p className="font-semibold">{d.title}</p><p className="text-xs text-ink-soft">{monthLabel(d.draw_month)} · {d.logic}</p></td>
                    <td><Badge tone={d.status === 'published' ? 'green' : 'amber'}>{d.status === 'published' ? `Published ${fmtDate(d.published_at)}` : 'Draft'}</Badge></td>
                    <td>{d.numbers ? <DrawBalls numbers={d.numbers} size="sm" /> : <span className="text-ink-soft">Not drawn</span>}</td>
                    <td>{d.status === 'published' ? money(Number(d.pool_total_minor)) : '-'}</td>
                    <td>{d.status === 'published' ? `${d.winners} of ${d.entrants}` : '-'}</td>
                    <td className="text-right">
                      {d.status === 'draft' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setSim(d)}>Simulate</Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(d)}>Delete</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan="6" className="text-center text-ink-soft">No draws yet. Create your first draft above.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
      </div>

      {sim && <SimulationModal draw={sim} onClose={() => setSim(null)} onPublished={reload} />}
    </div>
  );
}
