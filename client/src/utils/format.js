export const money = (minor = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((minor || 0) / 100);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const monthLabel = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '-');

// Same clock as the server (UTC) so the "no future dates" rule agrees on both sides.
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const SUB_LABEL = {
  active: 'Active',
  cancelling: 'Ends at period end',
  lapsed: 'Lapsed',
  inactive: 'Not subscribed',
};
export const SUB_TONE = { active: 'green', cancelling: 'amber', lapsed: 'rose', inactive: 'gray' };

export const monthlyEquivalent = (plan) => Math.round(plan.price_minor / plan.interval_months);
