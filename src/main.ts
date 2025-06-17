import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { PrismaService } from './prisma/prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as compression from 'compression';
import { CustomLoggerService } from './common/services/logger.service';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';

async function bootstrap() {
  const logger = new CustomLoggerService();
  
  try {
    // Create the application with better error handling
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new CustomLoggerService(),
      abortOnError: false, // Prevent errors from stopping the bootstrap process
      bufferLogs: true, // Buffer logs until the application is fully initialized
    });

  // Enable compression for better performance
  app.use(
    compression({
      level: 6, // Compression level (1-9)
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        // Don't compress images and already compressed files
        const contentType = res.getHeader('content-type');
        if (contentType && typeof contentType === 'string') {
          return (
            !contentType.includes('image/') && !contentType.includes('video/')
          );
        }
        return true;
      },
    }),
  );

  // Enhanced JSON parsing configuration
  app.use('/api', (req: any, res: any, next: any) => {
    // Validate Content-Type for JSON requests
    if (req.method !== 'GET' && req.headers['content-type']) {
      const contentType = req.headers['content-type'].toLowerCase();
      if (contentType.includes('application/json')) {
        // Add request ID for tracking
        req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Log incoming JSON requests for debugging
        const requestInfo = `RequestID: ${req.requestId}, Method: ${req.method}, URL: ${req.url}, ContentType: ${contentType}`;
        logger.debug(requestInfo, 'JsonRequestHandler');
      }
    }
    next();
  });

  // Phục vụ tệp tĩnh từ thư mục public
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Global Validation Pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // Global Exception Filters (order matters - more specific first)
  app.useGlobalFilters(
    new BusinessExceptionFilter(),
    new GlobalExceptionFilter(),
  );

  // Performance monitoring
  app.useGlobalInterceptors(new PerformanceInterceptor());

  // Add performance and caching headers
  app.use((req: any, res: any, next: any) => {
    // Security headers for performance
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Performance headers
    res.setHeader('X-Response-Time-Start', Date.now().toString());

    // Cache control for static assets
    if (
      req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    ) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    next();
  });

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://api.iccautotravel.com'],
                frameAncestors: ["'none'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: [],
              },
            }
          : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      xXssProtection: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Rate limiting with improved configuration
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: {
        status: 429,
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: 15 * 60, // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      keyGenerator: (req) => {
        const ip = req.ip || req.headers['x-forwarded-for'];
        return Array.isArray(ip) ? ip[0] : ip || 'unknown';
      },
      handler: (req, res) => {
        res.status(429).json({
          status: 429,
          error: 'Too Many Requests',
          message: 'Too many requests from this IP, please try again later',
          retryAfter: 15 * 60,
        });
      },
    }),
  );

  // CORS configuration based on environment
  const corsOrigins: string[] =
    process.env.NODE_ENV === 'production'
      ? [
          process.env.DASHBOARD_URL,
          process.env.FRONTEND_URL,
          'https://dashboard.iccautotravel.com',
          'https://iccautotravel.com',
        ].filter((url): url is string => Boolean(url))
      : [
          'http://localhost:3000', // NextJS dashboard
          'http://localhost:3001',
          'http://localhost:3002', // Dashboard chạy trên cổng 3002
          'http://localhost:4000',
          'http://localhost:1337', // Backend
          'http://localhost:1338', // Backend phiên bản khác
          'http://localhost', // Thêm localhost để cho phép truy cập từ file HTML cục bộ
          process.env.DASHBOARD_URL,
          process.env.FRONTEND_URL,
        ].filter((url): url is string => Boolean(url));

  logger.log(`Allowed CORS origins: ${corsOrigins.join(', ')}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, file://, or server-to-server calls)
      if (!origin) return callback(null, true);

      // Allow file:// protocol for local HTML testing
      if (origin.startsWith('file://')) return callback(null, true);

      // Check against allowed origins
      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Deny request
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-API-KEY',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ],
    exposedHeaders: ['Content-Length', 'Content-Range', 'X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Enable shutdown hooks for Prisma
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  // Thêm cơ chế tự động chọn cổng thay thế nếu cổng mặc định đã được sử dụng
  const port = Number(process.env.PORT || 1337);
  try {
    await app.listen(port);
    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    logger.log(`🔒 Security features: enabled`);
    logger.log(`📊 Health monitoring: enabled`);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EADDRINUSE'
    ) {
      logger.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      await app.listen(port + 1);
      logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
      logger.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.log(`🔒 Security features: enabled`);
      logger.log(`📊 Health monitoring: enabled`);
    } else {
      throw error;
    }
  }
  } catch (err) {
    // Provide more detailed error logging
    if (err instanceof Error) {
      logger.error(`❌ Application initialization failed: ${err.message}`, err.stack);
    } else {
      logger.error('❌ Application initialization failed', String(err));
    }
    
    // Log specific information about common errors
    if (err && typeof err === 'object') {
      if ('code' in err) {
        logger.warn(`Error code: ${String(err.code)}`);
      }
      
      if ('name' in err) {
        logger.warn(`Error name: ${String(err.name)}`);
      }
    }
    
    logger.warn('Continuing execution despite initialization error');
    // Don't exit process to allow the app to continue
  }
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  
  // Provide more detailed error logging in the catch handler
  if (err instanceof Error) {
    logger.error(`❌ Application failed to start: ${err.message}`, err.stack);
  } else {
    logger.error('❌ Application failed to start', String(err));
  }
  
  // Exit with error code
  process.exit(1);
});
