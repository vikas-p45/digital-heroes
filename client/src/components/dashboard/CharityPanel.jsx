import { useState } from 'react';
import { Link } from 'react-router-dom';
import { meApi } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { money } from '../../utils/format.js';
import CharityPicker from '../forms/CharityPicker.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function CharityPanel({ charity, onChange }) {
  const toast = useToast();
  const [value, setValue] = useState({ charityId: charity.id, percent: charity.percent });
  const [busy, setBusy] = useState(false);
  const dirty = value.charityId !== charity.id || value.percent !== charity.percent;

  const save = async () => {
    if (!value.charityId) return toast.error('Choose a charity first.');
    setBusy(true);
    try {
      await meApi.setCharity({ charity_id: value.charityId, charity_percent: value.percent });
      toast.success('Charity preferences saved.');
      onChange();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold">Your charity</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {charity.name ? <>Currently supporting <strong className="text-ink">{charity.name}</strong> with {charity.percent}% of your fee{charity.monthlyContributionMinor ? <> — about {money(charity.monthlyContributionMinor)} a month</> : null}.</> : 'You have not chosen a charity yet.'}
      </p>
      <div className="mt-5"><CharityPicker value={value} onChange={setValue} /></div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={busy} disabled={!dirty}>Save changes</Button>
        {charity.slug && <Link to={`/charities/${charity.slug}`} className="text-sm font-semibold underline">Donate directly</Link>}
      </div>
    </Card>
  );
}
