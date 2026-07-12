import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default_transitops_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '2525', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@transitops.com',
  },
  env: process.env.NODE_ENV || 'development',
};

// Validate critical configurations
if (!config.databaseUrl) {
  console.warn('[Warning] DATABASE_URL is missing in environment variables.');
}
