import { useState } from 'react';
import useAsync from '../../hooks/useAsync.js';
import useDebounce from '../../hooks/useDebounce.js';
import { adminApi, publicApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { SUB_LABEL, SUB_TONE, fmtDate } from '../../utils/format.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field, { Input, Select } from '../../components/ui/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';
import ScoresPanel from '../../components/dashboard/ScoresPanel.jsx';

const LIMIT = 10;

function UserEditor({ id, onClose, onSaved }) {
  const toast = useToast();
  const detail = useAsync(() => adminApi.user(id), [id]);
  const charities = useAsync(() => publicApi.charities({ limit: 50 }), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (detail.data && !form) {
    const u = detail.data.user;
    setForm({ name: u.name, role: u.role, charity_id: u.charity_id || '', charity_percent: u.charity_percent });
  }

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.patchUser(id, { ...form, charity_id: form.charity_id || null, charity_percent: Number(form.charity_percent) });
      toast.success('User updated.'); onSaved(); detail.reload();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const sub = async (body, msg) => {
    try { await adminApi.userSubscription(id, body); toast.success(msg); onSaved(); detail.reload(); } catch (e) { toast.error(e.message); }
  };

  const scoreApi = {
    add: (b) => adminApi.addUserScore(id, b),
    edit: (sid, b) => adminApi.editUserScore(id, sid, b),
    remove: (sid) => adminApi.deleteUserScore(id, sid),
  };

  return (
    <Modal title="Manage user" onClose={onClose} wide>
      {detail.loading && !detail.data && <Spinner />}
      <ErrorNote error={detail.error} onRetry={detail.reload} />
      {detail.data && form && (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Email"><Input value={detail.data.user.email} disabled /></Field>
              <Field label="Role">
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="subscriber">Subscriber</option><option value="admin">Administrator</option>
                </Select>
              </Field>
              <Field label="Charity share (%)"><Input type="number" min="10" max="100" value={form.charity_percent} onChange={(e) => setForm({ ...form, charity_percent: e.target.value })} /></Field>
              <Field label="Charity" className="sm:col-span-2">
                <Select value={form.charity_id} onChange={(e) => setForm({ ...form, charity_id: e.target.value })}>
                  <option value="">None</option>
                  {charities.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
            <Button onClick={save} loading={busy}>Save profile</Button>
          </section>

          <section className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">Subscription</h3>
              <Badge tone={SUB_TONE[detail.data.user.sub_status]}>{SUB_LABEL[detail.data.user.sub_status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {detail.data.user.plan_code ? `${detail.data.user.plan_code} plan, period ends ${fmtDate(detail.data.user.current_period_end)}.` : 'No subscription on record.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => sub({ action: 'grant', plan: 'monthly' }, 'Granted one month.')}>Grant 1 month</Button>
              <Button size="sm" variant="ghost" onClick={() => sub({ action: 'grant', plan: 'yearly' }, 'Granted one year.')}>Grant 1 year</Button>
              <Button size="sm" variant="danger" onClick={() => window.confirm('End this subscription now?') && sub({ action: 'end' }, 'Subscription ended.')}>End now</Button>
            </div>
          </section>

          <ScoresPanel flat title="Golf scores" scores={detail.data.scores} canWrite api={scoreApi} onChange={() => detail.reload()} />
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useAsync(() => adminApi.users({ q: dq, page, limit: LIMIT }), [dq, page]);

  return (
    <div>
      <div className="sm:max-w-sm">
        <Input type="search" placeholder="Search by name or email" aria-label="Search users" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      <div className="mt-4">
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Subscription</th><th>Charity</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td><p className="font-semibold">{u.name} {u.role === 'admin' && <Badge tone="indigo">Admin</Badge>}</p><p className="text-xs text-ink-soft">{u.email}</p></td>
                    <td><Badge tone={SUB_TONE[u.sub_status]}>{SUB_LABEL[u.sub_status]}</Badge>{u.plan_code && <span className="ml-2 text-xs capitalize text-ink-soft">{u.plan_code}</span>}</td>
                    <td>{u.charity_name ? `${u.charity_name} (${u.charity_percent}%)` : <span className="text-ink-soft">None</span>}</td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td className="text-right"><Button size="sm" variant="ghost" onClick={() => setEditing(u.id)}>Manage</Button></td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan="5" className="text-center text-ink-soft">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
      </div>
      {editing && <UserEditor id={editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}
