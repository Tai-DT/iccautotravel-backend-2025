// Development CORS configuration
export const corsConfig = {
  development: {
    origin: [
      'http://localhost:3000', // Dashboard
      'http://localhost:3001', // Alternative dashboard port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-HTTP-Method-Override',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  production: {
    origin: process.env.DASHBOARD_URL || 'https://dashboard.iccautotravel.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    credentials: true,
  },
  test: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'],
    credentials: true,
  },
};

export const getCorsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return corsConfig[env as keyof typeof corsConfig] || corsConfig.development;
};
