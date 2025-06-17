import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from '../services/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const request = req || ({} as Request); // Ensure request is never null/undefined
    const method = request.method || 'UNKNOWN';
    const originalUrl = request.originalUrl || 'UNKNOWN';
    const ip = request.ip || 'UNKNOWN';
    const userAgent = request.get ? request.get('user-agent') || '' : ''; // Safe access to .get()
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms - ${userAgent} ${ip}`,
        'RequestLogger',
      );
    });

    next();
  }
}
