import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const { combine, timestamp, printf, colorize } = winston.format;

    const logFormat = printf(
      ({ level, message, timestamp, context, trace }) => {
        // Safe string conversion function
        const safeStringify = (value: unknown): string => {
          if (typeof value === 'string') return value;
          if (value === null || value === undefined) return '';
          if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
          }
          try {
            return JSON.stringify(value);
          } catch {
            return '[Unable to stringify]';
          }
        };
        const timestampStr = safeStringify(timestamp);
        const contextStr = safeStringify(context) || 'Unknown';
        const levelStr = safeStringify(level);
        const messageStr = safeStringify(message);
        const traceStr = trace ? safeStringify(trace) : '';
        return `${timestampStr} [${contextStr}] ${levelStr}: ${messageStr}${traceStr ? `\n${traceStr}` : ''}`;
      },
    );

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: combine(timestamp(), logFormat),
      transports: [
        // Console transport with safe error handling
        new winston.transports.Console({
          format: combine(colorize(), timestamp(), logFormat),
          handleExceptions: false,
          handleRejections: false,
          silent: process.env.NODE_ENV === 'test',
        }),
        // File transport for all logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          handleExceptions: false,
          handleRejections: false,
        }),
        // File transport for error logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          handleExceptions: false,
          handleRejections: false,
        }),
      ],
      // Disable winston's built-in exception handling to prevent EIO errors
      exitOnError: false,
      handleExceptions: false,
      handleRejections: false,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string | object, context?: string) {
    // Handle both string traces and object traces properly
    let formattedTrace = '';
    if (trace) {
      if (typeof trace === 'string') {
        formattedTrace = trace;
      } else if (typeof trace === 'object') {
        try {
          formattedTrace = JSON.stringify(trace, null, 2);
        } catch {
          formattedTrace = '[Unable to stringify trace object]';
        }
      }
    }
    this.logger.error(message, { trace: formattedTrace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
