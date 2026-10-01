import { useState } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { SUB_LABEL, SUB_TONE, fmtDate } from '../../utils/format.js';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function SubscriptionCard({ subscription, onChange }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const s = subscription;

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); await refresh(); onChange(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const cancel = () => {
    if (window.confirm(`Cancel at the end of your current period (${fmtDate(s.periodEnd)})? You keep access until then.`)) {
      act(subscriptionApi.cancel, 'Your subscription will end at the period end.');
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">Subscription</h2>
        <Badge tone={SUB_TONE[s.status]}>{SUB_LABEL[s.status]}</Badge>
      </div>

      {s.status === 'inactive' && <p className="mt-3 text-ink-soft">You're not subscribed yet. Subscribe to log scores and enter the monthly draw.</p>}
      {s.status === 'lapsed' && <p className="mt-3 text-ink-soft">Your plan ended on {fmtDate(s.periodEnd)}. Renew to keep entering draws.</p>}
      {(s.status === 'active' || s.status === 'cancelling') && (
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div><dt className="text-sm text-ink-soft">Plan</dt><dd className="font-semibold capitalize">{s.plan}</dd></div>
          <div>
            <dt className="text-sm text-ink-soft">{s.status === 'cancelling' ? 'Access ends' : 'Renews on'}</dt>
            <dd className="font-semibold">{fmtDate(s.periodEnd)}</dd>
          </div>
        </dl>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {(s.status === 'inactive' || s.status === 'lapsed') && <Link to="/subscribe" className="btn btn-sun">{s.status === 'lapsed' ? 'Renew subscription' : 'Subscribe'}</Link>}
        {s.status === 'active' && <Button variant="ghost" size="sm" loading={busy} onClick={cancel}>Cancel subscription</Button>}
        {s.status === 'cancelling' && <Button variant="primary" size="sm" loading={busy} onClick={() => act(subscriptionApi.resume, 'Welcome back. Your subscription will renew.')}>Keep my subscription</Button>}
        {(s.status === 'active' || s.status === 'cancelling') && <Link to="/subscribe" className="btn btn-ghost btn-sm">Change or extend plan</Link>}
      </div>
    </Card>
  );
}
