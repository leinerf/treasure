import "dotenv/config";

const {
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    NODE_ENV,
} = process.env;

if (!NODE_ENV) {
    throw new Error("NODE_ENV is not defined");
}
if (!DB_HOST) {
    throw new Error("DB_HOST is not defined");
}
if (!DB_PORT) {
    throw new Error("DB_PORT is not defined");
}
if (!DB_USERNAME) {
    throw new Error("DB_USERNAME is not defined");
}
if (!DB_PASSWORD) {
    throw new Error("DB_PASSWORD is not defined");
}
if (!process.env[`DB_DATABASE_${NODE_ENV.toUpperCase()}`]) {
    throw new Error("DB_DATABASE is not defined");
}

const DB_DATABASE = process.env[`DB_DATABASE_${NODE_ENV.toUpperCase()}`]

export { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV };