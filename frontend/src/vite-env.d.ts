/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ENV?: "dev" | "prod";
    readonly VITE_DEV_BASE_URL?: string;
    readonly VITE_PROD_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
