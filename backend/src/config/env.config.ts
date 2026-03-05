import dotenv from 'dotenv';
dotenv.config();

const getEnvVar = (key: string, required = true): string | undefined => {
    const value = process.env[key];
    if (!value && required) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

export const env = {
    NODE_ENV: getEnvVar('NODE_ENV', false),
    PORT: getEnvVar('PORT'),
    MONGODB_URI: getEnvVar('MONGODB_URI'),
    REDIS_URI: getEnvVar('REDIS_URI'),
    JWT_ACCESS_SECRET: getEnvVar('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
    SENDER_EMAIL: getEnvVar('SENDER_EMAIL'),
    PASSKEY: getEnvVar('PASSKEY'),
    RESET_PASS_URL: getEnvVar('RESET_PASS_URL'),
    OTP_START_INTERVAL: getEnvVar('OTP_START_INTERVAL'),
    OTP_END_INTERVAL: getEnvVar('OTP_END_INTERVAL'),
    OTP_EXPIRY_SECONDS: getEnvVar('OTP_EXPIRY_SECONDS'),
    RESET_PASSWORD_TOKEN_EXPIRY_SECONDS: getEnvVar('RESET_PASSWORD_TOKEN_EXPIRY_SECONDS'),
    AWS_ACCESS_KEY: getEnvVar('AWS_ACCESS_KEY'),
    AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY'),
    AWS_BUCKET_NAME: getEnvVar('AWS_BUCKET_NAME'),
    AWS_REGION: getEnvVar('AWS_REGION'),
    AWS_PUT_URL_EXPIRY: getEnvVar('AWS_PUT_URL_EXPIRY'),
    AWS_GET_URL_EXPIRY: getEnvVar('AWS_GET_URL_EXPIRY'),
    LOG_MAX_SIZE: getEnvVar('LOG_MAX_SIZE'),
    LOG_MAX_FILES: getEnvVar('LOG_MAX_FILES'),
    BCRYPT_SALT_ROUNDS: getEnvVar('BCRYPT_SALT_ROUNDS'),
    STRIPE_SECRET_KEY: getEnvVar('STRIPE_SECRET_KEY'),
    WEBHOOK_SECRET_KEY: getEnvVar('WEBHOOK_SECRET_KEY'),
    FRONTEND_URL: getEnvVar('FRONTEND_URL'),
    GOOGLE_USERINFO_URL: getEnvVar('GOOGLE_USERINFO_URL'),
    GOOGLE_API_TIMEOUT: getEnvVar('GOOGLE_API_TIMEOUT'),
    GEMINI_API_KEY: getEnvVar('GEMINI_API_KEY'),
};