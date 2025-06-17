import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseException extends HttpException {
  constructor(message: string, error?: unknown, status?: HttpStatus) {
    super(message, status || HttpStatus.INTERNAL_SERVER_ERROR);
    this.stack = error instanceof Error ? error.stack : undefined;
  }

  static sqlInjectionAttempt(
    message: string = 'SQL Injection attempt detected',
  ): DatabaseException {
    return new DatabaseException(message, undefined, HttpStatus.BAD_REQUEST);
  }
}
