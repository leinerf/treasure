import { sql } from 'drizzle-orm';
import { db } from '../index.js';

export async function checkDbConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connected successfully.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
