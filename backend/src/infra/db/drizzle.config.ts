import 'dotenv/config';
import {defineConfig} from "drizzle-kit";
import { config } from "../../config.js"; 

export default defineConfig({
    schema: "./src/infra/db/schema/*.ts",
    out: "./src/infra/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        host: config.db_host,
        port: config.db_port,
        user: config.db_username,
        password: config.db_password,
        database: config.db_name,
        ssl: config.env === 'production' ? true : false
    },
});