import { money, monthlyEquivalent } from '../../utils/format.js';

// Radio-style plan picker. The yearly saving is calculated from real plan prices, not hard-coded.
export default function PlanCards({ plans, value, onChange }) {
  const monthly = plans.find((p) => p.code === 'monthly');
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Choose a plan">
      {plans.map((p) => {
        const selected = value === p.code;
        const saving = p.code === 'yearly' && monthly ? monthly.price_minor * p.interval_months - p.price_minor : 0;
        return (
          <button key={p.code} type="button" role="radio" aria-checked={selected} onClick={() => onChange(p.code)}
            className={`rounded-3xl border-2 p-5 text-left transition ${selected ? 'border-ink bg-mist' : 'border-line bg-white hover:border-ink/40'}`}>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">{p.name}</span>
              {saving > 0 && <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">Save {money(saving)}</span>}
            </div>
            <p className="mt-2 font-display text-3xl font-extrabold">{money(p.price_minor)}<span className="ml-1 text-sm font-medium text-ink-soft">/ {p.interval_months === 1 ? 'month' : 'year'}</span></p>
            {p.interval_months > 1 && <p className="mt-1 text-sm text-ink-soft">That is {money(monthlyEquivalent(p))} a month.</p>}
          </button>
        );
      })}
    </div>
  );
}
