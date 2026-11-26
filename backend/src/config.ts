import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

if(!process.env.NODE_ENV) {
    throw new Error('NODE_ENV is not defined');
}

if(!process.env.API_HOST) {
    throw new Error('API_HOST is not defined');
}

if(!process.env.API_PORT) {
    throw new Error('API_PORT is not defined');
}

if(!process.env.APP_BASE_URL) {
    throw new Error('APP_BASE_URL is not defined');
}

if(!process.env.API_STATIC_DIR) {
    throw new Error('API_STATIC_DIR is not defined');
}
if(!process.env.API_IMG_DIR) {
    throw new Error('API_IMG_DIR is not defined');
}
if(!process.env.GMAIL_ADDRESS) {
    throw new Error('GMAIL_ADDRESS is not defined');
}
if(!process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_APP_PASSWORD is not defined');
}
if(!process.env.JWT_SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY is not defined');
}
if(!process.env.SALT_ROUNDS) {
    throw new Error('SALT_ROUNDS is not defined');
}
if(!process.env.DB_HOST) {
    throw new Error('DB_HOST is not defined');
}
if(!process.env.DB_PORT) {
    throw new Error('DB_PORT is not defined');
}
if(!process.env.DB_USERNAME) {
    throw new Error('DB_USERNAME is not defined');
}
if(!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD is not defined');
}
if(!process.env.DB_NAME) {
    throw new Error('DB_NAME is not defined');
}

if(!process.env.ACCESS_KEY_ID) {
    throw new Error('ACCESS_KEY_ID is not defined');
}
if(!process.env.SECRET_ACCESS_KEY) {
    throw new Error('SECRET_ACCESS_KEY is not defined');
}
if(!process.env.BUCKET_NAME) {
    throw new Error('BUCKET_NAME is not defined');
}
if(!process.env.AWS_REGION) {
    throw new Error('AWS_REGION is not defined');
}

export const config = {
    env: process.env.NODE_ENV as string,
    api_host: process.env.API_HOST as string,
    api_port: Number(process.env.API_PORT),
    app_base_url: process.env.APP_BASE_URL as string,
    api_static_dir: process.env.API_STATIC_DIR as string,
    api_img_dir: process.env.API_IMG_DIR as string,
    allowed_origins: (process.env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    gmail_address: process.env.GMAIL_ADDRESS as string,
    gmail_app_password: process.env.GMAIL_APP_PASSWORD as string,
    jwt_secret_key: process.env.JWT_SECRET_KEY as string,
    salt_rounds: Number(process.env.SALT_ROUNDS),
    db_host: process.env.DB_HOST as string,
    db_port: Number(process.env.DB_PORT),
    db_username: process.env.DB_USERNAME as string,
    db_password: process.env.DB_PASSWORD as string,
    db_name: process.env.DB_NAME as string,
    aws_access_key_id: process.env.ACCESS_KEY_ID as string,
    aws_secret_access_key: process.env.SECRET_ACCESS_KEY as string,
    aws_s3_bucket_name: process.env.BUCKET_NAME as string,
    aws_s3_region: process.env.AWS_REGION as string,
};