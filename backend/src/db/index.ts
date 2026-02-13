import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgres://kehowli:password@localhost:5432/sf_crm';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
