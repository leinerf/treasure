// Values come from VITE_-prefixed variables in frontend/.env. Vite embeds them in the
// browser bundle at build time, so they must never hold secrets.
const env = import.meta.env.VITE_APP_ENV ?? "dev";

const config = {
    ENV: env,
    BASE_URL: env === "prod" ? import.meta.env.VITE_PROD_BASE_URL : import.meta.env.VITE_DEV_BASE_URL,
};

export default config;
