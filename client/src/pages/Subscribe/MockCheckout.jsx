import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { publicApi, subscriptionApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { money } from '../../utils/format.js';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

/** Test-mode checkout used when PAYMENT_PROVIDER=mock. No card details are collected or stored. */
export default function MockCheckout() {
  const [params] = useSearchParams();
  const planCode = params.get('plan') === 'yearly' ? 'yearly' : 'monthly';
  const { refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cfg = useAsync(publicApi.config, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (cfg.loading) return <Spinner />;
  if (cfg.data && cfg.data.paymentProvider !== 'mock') return <Navigate to="/subscribe" replace />;
  const plan = cfg.data?.plans.find((p) => p.code === planCode);

  const pay = async () => {
    setBusy(true); setError(null);
    try {
      await subscriptionApi.mockActivate(planCode);
      await refresh();
      toast.success('Payment received. Your subscription is active.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err); setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Confirm payment</h1>
      <div className="mt-2 rounded-2xl bg-sun/25 px-4 py-3 text-sm font-medium">Test mode: no real payment is taken. Switch the server to Stripe for live billing.</div>
      <div className="card mt-6 space-y-3">
        <ErrorNote error={cfg.error || error} />
        {plan && (
          <>
            <div className="flex items-center justify-between"><span className="text-ink-soft">Plan</span><span className="font-semibold">{plan.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-soft">Total today</span><span className="font-display text-2xl font-extrabold">{money(plan.price_minor)}</span></div>
            <Button variant="sun" size="lg" className="mt-2 w-full" loading={busy} onClick={pay}>Pay {money(plan.price_minor)}</Button>
          </>
        )}
      </div>
    </div>
  );
}
