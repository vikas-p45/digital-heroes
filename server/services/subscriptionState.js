export function subscriptionView(row) {
  if (!row || !row.plan_code) {
    return { status: 'inactive', hasAccess: false, plan: null, periodEnd: null, cancelAtPeriodEnd: false };
  }
  const live = row.sub_status === 'active' && row.current_period_end && new Date(row.current_period_end) > new Date();
  return {
    status: live ? (row.cancel_at_period_end ? 'cancelling' : 'active') : 'lapsed',
    hasAccess: Boolean(live),
    plan: row.plan_code,
    periodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    provider: row.provider,
  };
}

export const USER_WITH_SUB_SQL = `
  select u.id, u.name, u.email, u.role, u.charity_id, u.charity_percent, u.created_at,
         s.plan_code, s.status as sub_status, s.current_period_end, s.cancel_at_period_end, s.provider
  from users u left join subscriptions s on s.user_id = u.id`;
