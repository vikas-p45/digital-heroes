import { useState } from 'react';
import useAsync from '../../hooks/useAsync.js';
import { adminApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field, { Input, Textarea } from '../../components/ui/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

const LIMIT = 10;
const eventsToText = (events = []) => events.map((e) => [e.title, e.date, e.location].filter((x, i) => i === 0 || x !== undefined).join(' | ')).join('\n');
const textToEvents = (text) =>
  text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [title, date = '', location = ''] = l.split('|').map((s) => s.trim());
    return { title, date, location };
  });

function CharityForm({ charity, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: charity?.name || '', description: charity?.description || '', image_url: charity?.image_url || '',
    featured: charity?.featured || false, active: charity?.active ?? true, events: eventsToText(charity?.events),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const body = { name: f.name, description: f.description, image_url: f.image_url || null, featured: f.featured, active: f.active, events: textToEvents(f.events) };
    try {
      if (charity) await adminApi.updateCharity(charity.id, body); else await adminApi.createCharity(body);
      toast.success(charity ? 'Charity updated.' : 'Charity added. It is live without a redeploy.');
      onSaved(); onClose();
    } catch (err) { setError(err); setBusy(false); }
  };

  return (
    <Modal title={charity ? 'Edit charity' : 'Add charity'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <ErrorNote error={error} />
        <Field label="Name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Image URL (optional)" hint="Leave empty to use a generated cover."><Input type="url" placeholder="https://..." value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></Field>
        <Field label="Upcoming events" hint="One per line: Title | YYYY-MM-DD | Location"><Textarea value={f.events} onChange={(e) => setF({ ...f, events: e.target.value })} placeholder="Charity golf day | 2026-12-13 | Noida" /></Field>
        <div className="flex flex-wrap gap-6 text-sm font-semibold">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#1D1B4C]" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} />Show in homepage spotlight</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#1D1B4C]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Visible to the public</label>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{charity ? 'Save changes' : 'Add charity'}</Button></div>
      </form>
    </Modal>
  );
}

export default function AdminCharities() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => adminApi.charities({ page, limit: LIMIT }), [page]);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}? Members who chose it will need to pick another charity.`)) return;
    try { await adminApi.deleteCharity(c.id); toast.success('Charity deleted.'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex justify-end"><Button onClick={() => setEditing(null)}>Add charity</Button></div>
      <div className="mt-4">
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Charity</th><th>Status</th><th>Events</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td><p className="font-semibold">{c.name}</p><p className="line-clamp-1 max-w-md text-xs text-ink-soft">{c.description}</p></td>
                    <td className="space-x-1">{c.featured && <Badge tone="amber">Featured</Badge>}<Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Live' : 'Hidden'}</Badge></td>
                    <td>{c.events?.length || 0}</td>
                    <td className="text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(c)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(c)}>Delete</Button></div></td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr><td colSpan="4" className="text-center text-ink-soft">No charities yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
      </div>
      {editing !== undefined && <CharityForm charity={editing} onClose={() => setEditing(undefined)} onSaved={reload} />}
    </div>
  );
}
