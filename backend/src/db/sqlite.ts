import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || 'database.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDb();
  }
});

const initializeDb = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        content TEXT,
        feedTitle TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS refetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        details TEXT
      )
    `);
  });
};

export default db;
