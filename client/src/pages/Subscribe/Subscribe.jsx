import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { publicApi, subscriptionApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate } from '../../utils/format.js';
import PlanCards from '../../components/common/PlanCards.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

export default function Subscribe() {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cfg = useAsync(publicApi.config, []);
  const [plan, setPlan] = useState(params.get('plan') === 'yearly' ? 'yearly' : 'monthly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (params.get('checkout') === 'cancelled') setError(new Error('Checkout was cancelled. You have not been charged.')); }, [params]);

  const start = async () => {
    setBusy(true); setError(null);
    try {
      const r = await subscriptionApi.checkout(plan);
      if (r.mode === 'stripe') window.location.assign(r.url);
      else navigate(r.url);
    } catch (err) {
      setError(err); setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Choose your plan</h1>
      <p className="mt-2 text-ink-soft">Both plans include score tracking, every monthly draw and your chosen charity. Cancel any time.</p>

      {subscription?.hasAccess && (
        <div className="mt-6 rounded-2xl bg-sea-soft px-4 py-3 text-sm text-sea">
          You're already subscribed ({subscription.plan}) until {fmtDate(subscription.periodEnd)}. Paying again extends your time.{' '}
          <Link to="/dashboard" className="font-semibold underline">Go to dashboard</Link>
        </div>
      )}

      <div className="mt-8">
        {cfg.loading && <Spinner />}
        <ErrorNote error={cfg.error} onRetry={cfg.reload} />
        {cfg.data && <PlanCards plans={cfg.data.plans} value={plan} onChange={setPlan} />}
      </div>

      <div className="mt-6"><ErrorNote error={error} /></div>

      <div className="mt-6">
        {user ? (
          <Button size="lg" variant="sun" loading={busy} onClick={start} disabled={!cfg.data}>
            {subscription?.hasAccess ? 'Extend my subscription' : 'Continue to payment'}
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/signup?plan=${plan}`} className="btn btn-sun btn-lg">Create account to subscribe</Link>
            <Link to="/login" className="text-sm font-semibold underline">I already have an account</Link>
          </div>
        )}
      </div>
    </div>
  );
}
