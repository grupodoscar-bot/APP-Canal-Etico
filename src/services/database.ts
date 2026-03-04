import SQLite from 'react-native-sqlite-storage';
import { DB_NAME } from '../utils/constants';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabase({ name: DB_NAME, location: 'default' });
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.executeSql('PRAGMA foreign_keys = ON;');

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nif TEXT NOT NULL,
      company_name TEXT NOT NULL,
      trade_name TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      province TEXT NOT NULL,
      country TEXT DEFAULT 'ES',
      phone TEXT,
      email TEXT,
      invoice_series TEXT DEFAULT 'F',
      next_invoice_number INTEGER DEFAULT 1,
      logo_base64 TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nif TEXT NOT NULL,
      name TEXT NOT NULL,
      trade_name TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      province TEXT NOT NULL,
      country TEXT DEFAULT 'ES',
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      unit_price REAL NOT NULL,
      vat_rate INTEGER DEFAULT 21,
      category TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      series TEXT NOT NULL,
      number INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      operation_date TEXT,
      description TEXT,
      tax_base REAL NOT NULL,
      total_vat REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      hash TEXT NOT NULL,
      previous_hash TEXT DEFAULT '',
      fingerprint TEXT NOT NULL,
      verifactu_qr TEXT NOT NULL DEFAULT '',
      aeat_response_code TEXT,
      aeat_response_message TEXT,
      sent_to_aeat_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      vat_rate REAL NOT NULL,
      subtotal REAL NOT NULL,
      vat_amount REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
}

// Generic query helpers
export async function executeSql(
  sql: string,
  params: any[] = [],
): Promise<SQLite.ResultSet> {
  const database = await getDatabase();
  const [result] = await database.executeSql(sql, params);
  return result;
}

export async function getAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const result = await executeSql(sql, params);
  const rows: T[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(result.rows.item(i) as T);
  }
  return rows;
}

export async function getOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await executeSql(sql, params);
  if (result.rows.length === 0) return null;
  return result.rows.item(0) as T;
}
