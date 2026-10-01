import { useRef, useState } from 'react';
import { meApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDate, money } from '../../utils/format.js';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const MAX_BYTES = 1.5 * 1024 * 1024;
const PROOF = {
  none: ['Proof needed', 'amber'],
  submitted: ['Under review', 'indigo'],
  approved: ['Proof approved', 'green'],
  rejected: ['Proof rejected', 'rose'],
};

function ProofUpload({ winning, onDone }) {
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast.error('Upload a PNG, JPG or WebP screenshot.');
    if (file.size > MAX_BYTES) return toast.error('That image is over 1.5 MB. Try a smaller screenshot.');
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try { await meApi.uploadProof(winning.id, reader.result); toast.success('Proof uploaded. We will review it shortly.'); onDone(); }
      catch (err) { toast.error(err.message); } finally { setBusy(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={pick} aria-label="Upload score screenshot" />
      <Button size="sm" variant="sun" loading={busy} onClick={() => input.current.click()}>
        {winning.proof_status === 'rejected' ? 'Upload a new screenshot' : 'Upload screenshot'}
      </Button>
    </>
  );
}

export default function WinningsPanel({ winnings, onChange }) {
  return (
    <Card>
      <h2 className="text-xl font-bold">Winnings</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-mist p-4"><dt className="text-sm text-ink-soft">Total won</dt><dd className="font-display text-3xl font-extrabold">{money(winnings.totalWonMinor)}</dd></div>
        <div className="rounded-2xl bg-mist p-4"><dt className="text-sm text-ink-soft">Paid out</dt><dd className="font-display text-3xl font-extrabold">{money(winnings.paidMinor)}</dd></div>
      </dl>

      {winnings.items.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">No wins yet. Match three of the drawn numbers to win your first prize.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {winnings.items.map((w) => {
            const [label, tone] = PROOF[w.proof_status];
            return (
              <li key={w.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{w.draw_title}: {w.tier}-number match</p>
                    <p className="text-sm text-ink-soft">{fmtDate(w.created_at)}</p>
                  </div>
                  <p className="font-display text-2xl font-extrabold">{money(Number(w.amount_minor))}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  <Badge tone={w.payment_status === 'paid' ? 'green' : 'gray'}>{w.payment_status === 'paid' ? 'Paid' : 'Payment pending'}</Badge>
                </div>
                {w.proof_status === 'rejected' && w.admin_note && <p className="mt-3 rounded-xl bg-heart-soft px-3 py-2 text-sm text-[#9C2238]">Reviewer note: {w.admin_note}</p>}
                {w.proof_status === 'none' && <p className="mt-3 text-sm text-ink-soft">Upload a screenshot of your scores from the golf platform so we can verify your win.</p>}
                {['none', 'rejected'].includes(w.proof_status) && <div className="mt-3"><ProofUpload winning={w} onDone={onChange} /></div>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
