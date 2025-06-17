import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodes } from '../constants/error-codes';

@Catch()
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    if (exception instanceof BusinessException) {
      status = this.getHttpStatus(exception.code);
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message:
          typeof response === 'string' ? response : (response as any).message,
      };
    } else {
      this.logger.error('Unhandled exception:', exception);
      errorResponse.message = 'Internal server error';
    }

    // Log error details
    this.logger.error(
      `Error occurred: ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  private getHttpStatus(code: keyof typeof ErrorCodes): number {
    // User related errors
    if (code.startsWith('USER_')) {
      if (code === ErrorCodes.USER_NOT_FOUND) return HttpStatus.NOT_FOUND;
      return HttpStatus.BAD_REQUEST;
    }

    // Booking related errors
    if (code.startsWith('BOOKING_')) {
      if (code === ErrorCodes.BOOKING_NOT_FOUND) return HttpStatus.NOT_FOUND;
      if (code === ErrorCodes.BOOKING_VERSION_CONFLICT)
        return HttpStatus.CONFLICT;
      return HttpStatus.BAD_REQUEST;
    }

    // Payment related errors
    if (code.startsWith('PAYMENT_')) {
      if (code === ErrorCodes.PAYMENT_NOT_FOUND) return HttpStatus.NOT_FOUND;
      return HttpStatus.BAD_REQUEST;
    }

    // Authentication & Authorization errors
    if (code.startsWith('AUTH_')) {
      if (code === ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS)
        return HttpStatus.FORBIDDEN;
      return HttpStatus.UNAUTHORIZED;
    }

    // Integration errors
    if (code.startsWith('INTEGRATION_')) {
      return HttpStatus.BAD_REQUEST;
    }

    // System errors
    if (code.startsWith('SYSTEM_')) {
      if (code === ErrorCodes.SYSTEM_TIMEOUT) return HttpStatus.REQUEST_TIMEOUT;
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
