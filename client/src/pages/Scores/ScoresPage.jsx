import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync.js';
import { meApi } from '../../services/endpoints.js';
import ScoresPanel from '../../components/dashboard/ScoresPanel.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import ErrorNote from '../../components/common/ErrorNote.jsx';

export default function ScoresPage() {
  const { data, loading, error, reload } = useAsync(meApi.dashboard, []);
  if (loading && !data) return <Spinner />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorNote error={error} onRetry={reload} /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-ink-soft hover:text-ink">Back to dashboard</Link>
      <h1 className="mt-3 text-3xl font-extrabold">Your scores</h1>
      <div className="mt-6">
        <ScoresPanel scores={data.scores} canWrite={data.subscription.hasAccess}
          api={{ add: meApi.addScore, edit: meApi.editScore, remove: meApi.deleteScore }} onChange={reload} />
      </div>
    </div>
  );
}
