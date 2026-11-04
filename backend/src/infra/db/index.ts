import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import postgres from 'postgres';
import { config } from "../../config.js";

const sql = postgres({
    host: config.db_host,
    port: config.db_port,
    user: config.db_username,
    password: config.db_password,
    database: config.db_name,
    ssl: config.env === 'production' ? true : false
})

export const db = drizzle({client: sql});