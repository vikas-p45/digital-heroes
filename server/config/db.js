import pg from 'pg';
import { config } from './index.js';

// bigint -> number (money is stored in minor units and stays well below 2^53)
pg.types.setTypeParser(20, (v) => parseInt(v, 10));
// keep DATE columns as plain 'YYYY-MM-DD' strings (no timezone shifting)
pg.types.setTypeParser(1082, (v) => v);

const isLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
});

export const query = (text, params) => pool.query(text, params);

/** Run fn inside a transaction. fn receives a dedicated client. */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
