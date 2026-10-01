import useAsync from '../../hooks/useAsync.js';
import { publicApi } from '../../services/endpoints.js';
import Field, { Select } from '../ui/Field.jsx';

/** Charity dropdown + contribution slider. Fully controlled via `value` / `onChange`. */
export default function CharityPicker({ value, onChange, minPercent = 10 }) {
  const { data, loading } = useAsync(() => publicApi.charities({ limit: 50 }), []);
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <Field label="Charity you'd like to support">
        <Select value={value.charityId || ''} onChange={(e) => set({ charityId: e.target.value || null })} disabled={loading}>
          <option value="">{loading ? 'Loading charities...' : 'Choose a charity'}</option>
          {data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <label className="block">
        <span className="label">Share of your fee to charity: {value.percent}%</span>
        <input type="range" min={minPercent} max={60} value={value.percent}
          onChange={(e) => set({ percent: Number(e.target.value) })} className="w-full accent-[#FF5D73]" />
        <span className="mt-1 block text-xs text-ink-soft">Minimum {minPercent}%. Give more if you'd like to.</span>
      </label>
    </div>
  );
}
