import { useState } from 'react';
import { publicApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import Field, { Input, Textarea } from '../ui/Field.jsx';
import ErrorNote from '../common/ErrorNote.jsx';

const QUICK = [100, 500, 1000];

/** Independent donation: works for visitors and members, and is not tied to gameplay. */
export default function DonateForm({ charity }) {
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await publicApi.donate({ charity_id: charity.id, amount: Number(amount), donor_name: name || undefined, note: note || undefined });
      toast.success(`Thank you. Your donation to ${charity.name} is recorded.`);
      setAmount(''); setNote('');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-xl font-bold">Donate directly</h2>
        <p className="text-sm text-ink-soft">A one-off gift, separate from your subscription and the draw.</p>
      </div>
      <ErrorNote error={error} />
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button type="button" key={q} onClick={() => setAmount(String(q))}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${Number(amount) === q ? 'bg-ink text-white' : 'bg-mist hover:bg-line'}`}>
            ₹{q}
          </button>
        ))}
      </div>
      <Field label="Amount (₹)"><Input type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      {!user && <Field label="Your name (optional)"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>}
      <Field label="Message (optional)"><Textarea maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <Button type="submit" variant="sun" loading={busy} className="w-full">Donate</Button>
    </form>
  );
}
