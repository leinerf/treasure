import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../models/entity/user.js";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '../config.js';
import { EmailVerificationCode } from "../models/entity/emailVerificationCode.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const dataSource = new DataSource({
    type: "postgres",
    host: DB_HOST!,
    port: Number(DB_PORT!),
    username: DB_USERNAME!,
    password: DB_PASSWORD!,
    database: DB_DATABASE!,
    synchronize: false,
    logging: false,
    entities: [
        User,
        EmailVerificationCode
    ],
    migrations: [__dirname + "/migrations/*{.ts,.js}"],
    migrationsRun: false,
    migrationsTableName: "migrations",
    migrationsTransactionMode: "all",
    subscribers: [],
});
export default dataSource;