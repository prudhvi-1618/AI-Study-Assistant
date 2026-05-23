import mysql from 'mysql2/promise';
import { env } from '../../config/env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = {
  query: async <T>(sql: string, params?: unknown[]): Promise<T> => {
    const [results] = await pool.query(sql, params);
    return results as T;
  },
};
