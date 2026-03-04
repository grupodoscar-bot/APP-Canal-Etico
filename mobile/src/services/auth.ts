import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { executeSql, getOne } from './database';
import { User } from '../models/User';

const SESSION_KEY = '@verifactu_session';

function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

export async function register(
  email: string,
  name: string,
  password: string,
): Promise<User> {
  const existing = await getOne<any>(
    'SELECT id FROM users WHERE email = ?',
    [email.toLowerCase()],
  );
  if (existing) {
    throw new Error('Ya existe una cuenta con este email');
  }

  const passwordHash = hashPassword(password);
  const result = await executeSql(
    'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
    [email.toLowerCase(), name, passwordHash],
  );

  const user: User = {
    id: result.insertId,
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await saveSession(user);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const row = await getOne<any>(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()],
  );

  if (!row) {
    throw new Error('Email o contraseña incorrectos');
  }

  const passwordHash = hashPassword(password);
  if (row.password_hash !== passwordHash) {
    throw new Error('Email o contraseña incorrectos');
  }

  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };

  await saveSession(user);
  return user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getSession(): Promise<User | null> {
  const data = await AsyncStorage.getItem(SESSION_KEY);
  if (!data) return null;
  return JSON.parse(data) as User;
}

async function saveSession(user: User): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
