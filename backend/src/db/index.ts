import dotenv from 'dotenv';
import sqliteDb from './sqlite';
import postgresPool from './postgres';
import { RunResult } from 'sqlite3';
import { QueryResult } from 'pg';

dotenv.config();

const dbType = process.env.DATABASE_TYPE || 'sqlite';

let query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
let run: (sql: string, params?: unknown[]) => Promise<RunResult | QueryResult>;

if (dbType === 'postgres') {
  query = <T>(sql: string, params?: unknown[]) => postgresPool.query(sql, params).then((res: QueryResult) => res.rows as T[]);
  run = (sql, params) => postgresPool.query(sql, params);
} else {
  const toSqliteParams = (sql: string) => sql.replace(/\$\d+/g, '?');
  
  query = <T>(sql: string, params?: unknown[]) => {
    return new Promise<T[]>((resolve, reject) => {
      sqliteDb.all(toSqliteParams(sql), params, (err: Error | null, rows: T[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  };

  run = (sql, params) => {
    return new Promise((resolve, reject) => {
      sqliteDb.run(toSqliteParams(sql), params, function (this: RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  };
}

export { query, run };
