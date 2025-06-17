import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import AggregateError from 'aggregate-error';
import { GqlContextType } from '@nestjs/graphql';

interface AggregateErrorWithErrors extends AggregateError {
  errors?: unknown[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() === 'graphql') {
      // Let the GraphQLExceptionFilter handle GraphQL errors
      // This filter is registered after GlobalExceptionFilter in app.module.ts
      // So this GlobalExceptionFilter should not handle GraphQL requests
      return;
    }

    // Handle HTTP requests
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest() || {};

    // Properly serialize error for logging
    const errorForLogging = this.serializeError(exception);

    // Create a safe string representation of error details
    const errorDetails = {
      error: {
        message: errorForLogging.message,
        name: errorForLogging.name,
        stack: errorForLogging.stack,
      },
      request: {
        method: request.method || 'UNKNOWN',
        url: request.url || 'UNKNOWN',
        userAgent: request.headers?.['user-agent'] || 'UNKNOWN',
      },
    };

    // Log the error with properly stringified details
    this.logger.error(
      `HTTP Error: ${errorForLogging.message}`,
      errorDetails,
      GlobalExceptionFilter.name,
    );

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      code = (exceptionResponse as any).code || code;
    }
    // Handle JSON parsing errors specifically
    else if (
      exception instanceof SyntaxError &&
      exception.message.includes('JSON')
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid JSON format in request body';
      code = 'INVALID_JSON';
      this.logger.error('JSON parsing error caught by GlobalExceptionFilter', {
        error: exception.message,
        method: request?.method || 'UNKNOWN',
        url: request?.url || 'UNKNOWN',
        userAgent: request?.headers?.['user-agent'] || 'UNKNOWN',
        contentType: request?.headers?.['content-type'] || 'UNKNOWN',
      });
    }
    // Handle Prisma Errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Unique constraint violation';
          code = 'UNIQUE_VIOLATION';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          code = 'NOT_FOUND';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database error';
          code = 'DATABASE_ERROR';
      }
    }
    // Handle AggregateError specifically
    else if (
      typeof AggregateError !== 'undefined' &&
      exception instanceof AggregateError
    ) {
      this.logger.error(`AggregateError: ${exception.message}`);
      const aggregateError = exception as AggregateErrorWithErrors;
      if (Array.isArray(aggregateError.errors)) {
        aggregateError.errors.forEach((err: unknown, index: number) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : this.serializeError(err).message;
          this.logger.error(
            `  Error ${index + 1}: ${errorMessage}`,
            err instanceof Error ? err.stack : undefined,
          );
        });
      } else {
        this.logger.error(
          `AggregateError encountered without an 'errors' array property.`,
        );
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name || code;
      this.logger.error(
        `Unhandled Error: ${exception.message}`,
        exception.stack,
      );
    }

    // Respond with error
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      code,
      message,
      path: request?.url || 'UNKNOWN',
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });
  }

  private serializeError(exception: unknown): {
    message: string;
    stack?: string;
    name?: string;
  } {
    if (exception instanceof Error) {
      return {
        message: exception.message,
        stack: exception.stack,
        name: exception.name,
      };
    }

    if (exception && typeof exception === 'object') {
      try {
        return {
          message: JSON.stringify(exception, null, 2),
          name: exception.constructor?.name || 'Unknown',
        };
      } catch {
        return {
          message: '[Complex Object - Cannot Serialize]',
          name: 'SerializationError',
        };
      }
    }

    if (typeof exception === 'string') {
      return {
        message: exception,
        name: 'StringException',
      };
    }

    if (typeof exception === 'number' || typeof exception === 'boolean') {
      return {
        message: exception.toString(),
        name: 'PrimitiveException',
      };
    }

    return {
      message: '[Unknown Exception Type]',
      name: 'UnknownException',
    };
  }
}
