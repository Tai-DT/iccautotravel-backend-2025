import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from '../services/logger.service';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  private readonly timeout: number;

  constructor(private readonly logger: CustomLoggerService) {
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10); // Default 30 seconds
  }

  use(req: Request, res: Response, next: NextFunction) {
    res.setTimeout(this.timeout, () => {
      const method = req?.method || 'UNKNOWN';
      const originalUrl = req?.originalUrl || 'UNKNOWN';
      this.logger.warn(
        `Request timeout after ${this.timeout}ms: ${method} ${originalUrl}`,
        'TimeoutMiddleware',
      );
      res.status(408).json({
        statusCode: 408,
        message: 'Request timeout',
      });
    });

    next();
  }
}
