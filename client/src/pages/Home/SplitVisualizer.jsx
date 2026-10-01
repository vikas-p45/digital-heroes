import { useState } from 'react';
import { money, monthlyEquivalent } from '../../utils/format.js';

/**
 * The homepage centrepiece: shows exactly where a subscription goes, using the live
 * plan prices and the admin-configured prize pool percentage. Moving the slider
 * animates the bar - motion that answers the visitor's own action.
 */
export default function SplitVisualizer({ config }) {
  const [planCode, setPlanCode] = useState('monthly');
  const minPct = config.minCharityPercent;
  const maxPct = Math.max(minPct, Math.min(60, 100 - config.poolPercent));
  const [pct, setPct] = useState(Math.min(20, maxPct));

  const plan = config.plans.find((p) => p.code === planCode) || config.plans[0];
  const monthly = monthlyEquivalent(plan);
  const charity = Math.floor((monthly * pct) / 100);
  const pool = Math.floor((monthly * config.poolPercent) / 100);
  const rest = monthly - charity - pool;

  const rows = [
    { label: 'To your charity', value: charity, pct, color: 'bg-heart' },
    { label: 'Into the prize pool', value: pool, pct: config.poolPercent, color: 'bg-sun' },
    { label: 'Running the platform', value: rest, pct: 100 - pct - config.poolPercent, color: 'bg-ink' },
  ];

  return (
    <div className="card shadow-lift">
      <h2 className="text-xl font-bold">Where your subscription goes</h2>
      <p className="mt-1 text-sm text-ink-soft">Every month, for every member. You choose the charity share.</p>

      <div className="mt-5 flex gap-2" role="group" aria-label="Billing">
        {config.plans.map((p) => (
          <button key={p.code} onClick={() => setPlanCode(p.code)} aria-pressed={planCode === p.code}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${planCode === p.code ? 'bg-ink text-white' : 'bg-mist text-ink hover:bg-line'}`}>
            {p.name}
          </button>
        ))}
      </div>

      <p className="mt-5 font-display text-4xl font-extrabold">
        {money(monthly)}<span className="ml-1 text-base font-medium text-ink-soft">a month</span>
      </p>

      <div className="mt-4 flex h-6 w-full overflow-hidden rounded-full bg-mist" role="img"
        aria-label={`${money(charity)} to charity, ${money(pool)} to the prize pool, ${money(rest)} to the platform`}>
        {rows.map((r) => (
          <div key={r.label} className={`${r.color} transition-[width] duration-300`} style={{ width: `${Math.max(0, r.pct)}%` }} />
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${r.color}`} />{r.label}</span>
            <span className="font-semibold">{money(r.value)}</span>
          </li>
        ))}
      </ul>

      <label className="mt-6 block">
        <span className="label">Charity share: {pct}%</span>
        <input type="range" min={minPct} max={maxPct} value={pct} onChange={(e) => setPct(Number(e.target.value))}
          className="w-full accent-[#FF5D73]" />
        <span className="mt-1 block text-xs text-ink-soft">Minimum {minPct}%. You can change it any time from your dashboard.</span>
      </label>
    </div>
  );
}
