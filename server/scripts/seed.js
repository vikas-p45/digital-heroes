/**
 * Seeds charities, an admin, a demo player and 14 more demo subscribers so that a draw
 * simulation produces meaningful numbers straight away. Safe to run more than once.
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { addScore } from '../services/scoreService.js';
import { activateSubscription } from '../services/subscriptionService.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@digitalheroes.test').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const DEMO_PASSWORD = 'Demo@12345';

const charities = [
  { name: 'Bright Start Literacy', slug: 'bright-start-literacy', featured: true,
    description: 'Runs reading circles in under-resourced schools and gives every child their first set of books. Your contribution covers reading kits, trained volunteers and follow-up assessments.',
    events: [{ title: 'Community reading day', date: '2026-11-08', location: 'Lucknow' }, { title: 'Charity golf morning', date: '2026-12-13', location: 'Noida' }] },
  { name: 'Clean Rivers Collective', slug: 'clean-rivers-collective', featured: true,
    description: 'Community-led river clean-ups and water testing across the Gangetic plain. Funds pay for equipment, waste sorting and local crews.',
    events: [{ title: 'Riverbank clean-up', date: '2026-10-19', location: 'Varanasi' }] },
  { name: 'Open Hands Food Bank', slug: 'open-hands-food-bank', featured: true,
    description: 'Collects surplus food from markets and restaurants and delivers it to community kitchens the same day.',
    events: [{ title: 'Charity golf day', date: '2026-11-22', location: 'Delhi NCR' }] },
  { name: 'Second Wind Youth Sports', slug: 'second-wind-youth-sports', featured: false,
    description: 'Free coaching and equipment for teenagers who would otherwise never get to play organised sport.', events: [] },
  { name: 'Quiet Mind Foundation', slug: 'quiet-mind-foundation', featured: false,
    description: 'Low-cost counselling and peer support groups for students and young professionals.', events: [{ title: 'Open listening evening', date: '2026-10-30', location: 'Online' }] },
  { name: 'Paws & Shelter Project', slug: 'paws-and-shelter-project', featured: false,
    description: 'Rescue, vaccination and adoption drives for street animals, run by local volunteers.', events: [] },
];

async function upsertUser({ name, email, password, role = 'subscriber', charityId = null, percent = 10 }) {
  const existing = await pool.query('select id from users where lower(email) = $1', [email.toLowerCase()]);
  if (existing.rowCount) {
    if (role === 'admin') await pool.query(`update users set role = 'admin', password_hash = $2 where id = $1`, [existing.rows[0].id, await bcrypt.hash(password, 10)]);
    return { id: existing.rows[0].id, created: false };
  }
  const { rows: [u] } = await pool.query(
    'insert into users (name, email, password_hash, role, charity_id, charity_percent) values ($1,$2,$3,$4,$5,$6) returning id',
    [name, email.toLowerCase(), await bcrypt.hash(password, 10), role, charityId, percent]);
  return { id: u.id, created: true };
}

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

try {
  for (const c of charities) {
    await pool.query(
      `insert into charities (name, slug, description, events, featured) values ($1,$2,$3,$4,$5) on conflict (slug) do nothing`,
      [c.name, c.slug, c.description, JSON.stringify(c.events), c.featured]);
  }
  const { rows: cs } = await pool.query('select id from charities order by name');

  await upsertUser({ name: 'Platform Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });

  const players = [{ name: 'Demo Player', email: 'demo@digitalheroes.test', plan: 'monthly' }];
  for (let i = 1; i <= 14; i++) players.push({ name: `Player ${i}`, email: `player${i}@example.com`, plan: i % 4 === 0 ? 'yearly' : 'monthly' });

  for (const [i, p] of players.entries()) {
    const { id, created } = await upsertUser({
      name: p.name, email: p.email, password: DEMO_PASSWORD,
      charityId: cs[i % cs.length].id, percent: [10, 10, 15, 20, 25][i % 5],
    });
    if (!created) continue;
    await activateSubscription(id, p.plan, { provider: 'seed', providerRef: 'seed' });
    for (let d = 0; d < 5; d++) {
      await addScore(id, { score: 14 + Math.floor(Math.random() * 27), played_on: iso(d * 6 + 1) });
    }
  }

  const { rowCount } = await pool.query('select 1 from draws limit 1');
  if (!rowCount) {
    const title = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }) + ' draw';
    await pool.query(`insert into draws (title, draw_month, logic) values ($1, date_trunc('month', now())::date, 'random')`, [title]);
  }

  console.log('Seed complete.');
  console.log(`  Admin  : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Player : demo@digitalheroes.test / ${DEMO_PASSWORD}`);
} catch (e) {
  console.error('Seed failed:', e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
