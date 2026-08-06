export const config = {
  env: process.env['NODE_ENV'] ?? 'development',
  port: Number(process.env['PORT'] ?? 4000),
  corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:5173,http://localhost:4173').split(','),
  /** Phase 2: DATABASE_URL, JWT_SECRET, S3 credentials, SMTP, WhatsApp Business token. */
} as const;
