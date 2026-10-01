import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const sql = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../config/schema.sql'), 'utf8');
try {
  await pool.query(sql);
  console.log('Schema is up to date.');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
