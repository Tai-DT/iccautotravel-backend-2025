import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ResponseCacheMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Simple cache headers for API responses
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        ETag: `W/"${Date.now()}"`,
      });
    }
    next();
  }
}
