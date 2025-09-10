import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'app.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

sqlite3.verbose();
export const db = new sqlite3.Database(dbPath);

export function runMigrations(): Promise<void> {
  return new Promise((resolve, reject) => {
    const migrationsPath = path.join(process.cwd(), 'src', 'db', 'migrations.sql');
    fs.readFile(migrationsPath, 'utf8', (err, sql) => {
      if (err) return reject(err);
      db.exec(sql, (execErr) => {
        if (execErr) return reject(execErr);
        resolve();
      });
    });
  });
}

export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }>{
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T);
    });
  });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

export async function seedIfEmpty(): Promise<void> {
  const userCountRow = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (!userCountRow || userCountRow.count === 0) {
    await dbRun("INSERT INTO users (name, email, role) VALUES (?,?,?)", ['Alice Johnson','alice@example.com','Developer']);
    await dbRun("INSERT INTO users (name, email, role) VALUES (?,?,?)", ['Bob Smith','bob@example.com','Designer']);
    await dbRun("INSERT INTO users (name, email, role) VALUES (?,?,?)", ['Carol Lee','carol@example.com','QA']);
    await dbRun("INSERT INTO users (name, email, role) VALUES (?,?,?)", ['Dave Kim','dave@example.com','Manager']);
  }
}
