function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get databaseUrl() {
    return requireEnv('DATABASE_URL');
  },
  get jwtSecret() {
    return requireEnv('JWT_SECRET');
  },
  get port() {
    return Number(process.env.PORT) || 4000;
  },
  get corsOrigin() {
    return process.env.CORS_ORIGIN || 'http://localhost:5173';
  },
  get telegramApiId() {
    return process.env.TELEGRAM_API_ID || '';
  },
  get telegramApiHash() {
    return process.env.TELEGRAM_API_HASH || '';
  },
};
