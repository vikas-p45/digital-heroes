import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { meApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import SubscriptionCard from '../../components/dashboard/SubscriptionCard.jsx';
import ScoresPanel from '../../components/dashboard/ScoresPanel.jsx';
import CharityPanel from '../../components/dashboard/CharityPanel.jsx';
import ParticipationCard from '../../components/dashboard/ParticipationCard.jsx';
import WinningsPanel from '../../components/dashboard/WinningsPanel.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

export default function Dashboard() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useAsync(meApi.dashboard, []);

  // Returning from Stripe Checkout: re-read the subscription straight away.
  useEffect(() => {
    if (params.get('checkout') === 'success') {
      toast.success('Payment received. Activating your subscription...');
      refresh().then(reload);
      setParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) return <Spinner label="Loading your dashboard" />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorNote error={error} onRetry={reload} /></div>;

  const scoreApi = { add: meApi.addScore, edit: meApi.editScore, remove: meApi.deleteScore };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Hi, {data.user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-ink-soft">Here's where your scores, subscription and giving stand.</p>
        </div>
        <Link to="/draws" className="btn btn-ghost btn-sm">View draw results</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SubscriptionCard subscription={data.subscription} onChange={reload} />
        <ParticipationCard participation={data.participation} />
        <ScoresPanel scores={data.scores} canWrite={data.subscription.hasAccess} api={scoreApi} onChange={reload} />
        <div className="space-y-6">
          <CharityPanel key={`${data.charity.id}-${data.charity.percent}`} charity={data.charity} onChange={reload} />
        </div>
        <div className="lg:col-span-2"><WinningsPanel winnings={data.winnings} onChange={reload} /></div>
      </div>
    </div>
  );
}
