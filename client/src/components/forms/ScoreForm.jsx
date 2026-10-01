import { useState } from 'react';
import { todayISO } from '../../utils/format.js';
import Button from '../ui/Button.jsx';
import Field, { Input } from '../ui/Field.jsx';
import ErrorNote from '../common/ErrorNote.jsx';

/** One Stableford score (1-45) plus the date it was played. Used for both adding and editing. */
export default function ScoreForm({ initial, submitLabel = 'Add score', onSubmit, onCancel }) {
  const [score, setScore] = useState(initial?.score ?? '');
  const [date, setDate] = useState(initial?.played_on ?? todayISO());
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(score);
    if (!Number.isInteger(n) || n < 1 || n > 45) return setError(new Error('Score must be a whole number between 1 and 45.'));
    setBusy(true); setError(null);
    try {
      await onSubmit({ score: n, played_on: date });
      if (!initial) setScore('');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <ErrorNote error={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Stableford score (1-45)">
          <Input type="number" inputMode="numeric" min="1" max="45" required value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>
        <Field label="Date played">
          <Input type="date" required max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
