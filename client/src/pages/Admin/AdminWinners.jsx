import { useState } from 'react';
import useAsync from '../../hooks/useAsync.js';
import { adminApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { fmtDate, money } from '../../utils/format.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Field, { Select, Textarea } from '../../components/ui/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

const LIMIT = 10;
const PROOF = { none: ['No proof yet', 'gray'], submitted: ['Needs review', 'amber'], approved: ['Approved', 'green'], rejected: ['Rejected', 'rose'] };

function ReviewModal({ winner, onClose, onDone }) {
  const toast = useToast();
  const proof = useAsync(() => adminApi.winnerProof(winner.id), [winner.id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (decision) => {
    setBusy(true);
    try {
      await adminApi.reviewWinner(winner.id, { decision, note: note || undefined });
      toast.success(decision === 'approve' ? 'Proof approved.' : 'Proof rejected. The winner can upload a new one.');
      onDone(); onClose();
    } catch (e) { toast.error(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Review proof: ${winner.name}`} onClose={onClose} wide>
      <p className="text-sm text-ink-soft">{winner.draw_title} · {winner.tier}-number match · {money(Number(winner.amount_minor))}</p>
      {proof.loading && <Spinner />}
      <ErrorNote error={proof.error} />
      {proof.data && <img src={proof.data.image} alt={`Score screenshot from ${winner.name}`} className="mt-4 max-h-[55vh] w-full rounded-2xl border border-line object-contain" />}
      {winner.proof_status === 'submitted' && (
        <div className="mt-5 space-y-4">
          <Field label="Note to the winner" hint="Required when rejecting."><Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="danger" loading={busy} onClick={() => decide('reject')}>Reject</Button>
            <Button variant="sun" loading={busy} onClick={() => decide('approve')}>Approve</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminWinners() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [proof, setProof] = useState('');
  const [payment, setPayment] = useState('');
  const [review, setReview] = useState(null);
  const { data, loading, error, reload } = useAsync(() => adminApi.winners({ proof, payment, page, limit: LIMIT }), [proof, payment, page]);

  const pay = async (w) => {
    if (!window.confirm(`Mark ${money(Number(w.amount_minor))} as paid to ${w.name}?`)) return;
    try { await adminApi.payWinner(w.id); toast.success('Marked as paid.'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="w-48"><Select aria-label="Proof status" value={proof} onChange={(e) => { setProof(e.target.value); setPage(1); }}>
          <option value="">All proof statuses</option><option value="submitted">Needs review</option><option value="none">No proof yet</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </Select></div>
        <div className="w-48"><Select aria-label="Payment status" value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }}>
          <option value="">All payments</option><option value="pending">Pending</option><option value="paid">Paid</option>
        </Select></div>
      </div>

      <div className="mt-4">
        {loading && !data && <Spinner />}
        <ErrorNote error={error} onRetry={reload} />
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Winner</th><th>Draw</th><th>Prize</th><th>Proof</th><th>Payment</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.items.map((w) => {
                  const [label, tone] = PROOF[w.proof_status];
                  return (
                    <tr key={w.id}>
                      <td><p className="font-semibold">{w.name}</p><p className="text-xs text-ink-soft">{w.email}</p></td>
                      <td>{w.draw_title}<p className="text-xs text-ink-soft">{w.tier}-number match</p></td>
                      <td className="font-semibold">{money(Number(w.amount_minor))}</td>
                      <td><Badge tone={tone}>{label}</Badge></td>
                      <td><Badge tone={w.payment_status === 'paid' ? 'green' : 'gray'}>{w.payment_status === 'paid' ? `Paid ${fmtDate(w.paid_at)}` : 'Pending'}</Badge></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {w.has_proof && <Button size="sm" variant={w.proof_status === 'submitted' ? 'primary' : 'ghost'} onClick={() => setReview(w)}>{w.proof_status === 'submitted' ? 'Review' : 'View proof'}</Button>}
                          {w.proof_status === 'approved' && w.payment_status === 'pending' && <Button size="sm" variant="sun" onClick={() => pay(w)}>Mark paid</Button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && <tr><td colSpan="6" className="text-center text-ink-soft">No winners match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={page} total={data.total} limit={LIMIT} onPage={setPage} />}
      </div>
      {review && <ReviewModal winner={review} onClose={() => setReview(null)} onDone={reload} />}
    </div>
  );
}
