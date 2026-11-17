const config = {
    ENV: import.meta.env.MODE,
    BASE_URL: import.meta.env.MODE === 'prod' ? import.meta.env.PROD_BASE_URL : import.meta.env.DEV_BASE_URL,
};

export default config;