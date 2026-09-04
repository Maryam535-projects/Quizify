const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[db] WARNING: DATABASE_URL is not set. Set it in backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

module.exports = { pool };
