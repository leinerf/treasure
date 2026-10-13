const config = {
    ENV: NODE_ENV,
    BASE_URL: NODE_ENV === 'prod' ? PROD_BASE_URL : DEV_BASE_URL,
};

export default config;