import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
  void initializeDb();
});

const initializeDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feeds (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        content TEXT,
        feedTitle TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS refetch_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        details TEXT
      )
    `);
  } catch (err) {
    console.error('Error initializing PostgreSQL database', err);
  }
};

export default pool;
