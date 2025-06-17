import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from '../services/logger.service';

@Injectable()
export class JsonErrorMiddleware implements NestMiddleware {
  private readonly logger = new CustomLoggerService();

  use(req: Request, res: Response, next: NextFunction) {
    // Override the Express body parser error handling
    const originalJson = res.json.bind(res);

    // Capture JSON parsing errors from Express body parser
    const handleBodyParserError = (err: any) => {
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        this.logger.error(
          'JSON parsing error detected',
          JSON.stringify({
            error: err.message,
            method: req.method,
            url: req.url,
            userAgent: req.headers?.['user-agent'],
            contentType: req.headers?.['content-type'],
            contentLength: req.headers?.['content-length'],
            body: req.body
              ? JSON.stringify(req.body).substring(0, 500)
              : 'empty',
            stack: err.stack,
          }),
        );

        const errorResponse = {
          statusCode: 400,
          code: 'INVALID_JSON',
          message: 'Invalid JSON format in request body',
          details:
            'Please check your JSON syntax. Common issues: unescaped quotes, trailing commas, or invalid characters.',
          timestamp: new Date().toISOString(),
          path: req.url,
          hint: 'Use a JSON validator to verify your request payload',
        };

        return res.status(400).json(errorResponse);
      }
      return next(err);
    };

    // Handle parsing errors at request level
    req.on('error', handleBodyParserError);

    // Enhance response methods to catch JSON serialization errors
    res.json = function (body: any) {
      try {
        return originalJson(body);
      } catch (err) {
        console.error('JSON serialization error:', err);
        return originalJson({
          statusCode: 500,
          code: 'JSON_SERIALIZATION_ERROR',
          message: 'Error serializing response to JSON',
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Add request timeout handling
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        this.logger.warn(
          'Request timeout',
          JSON.stringify({
            method: req.method,
            url: req.url,
            userAgent: req.headers?.['user-agent'],
            timeout: '30s',
          }),
        );

        res.status(408).json({
          statusCode: 408,
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout after 30 seconds',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }, 30000); // 30 second timeout

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  }
}
