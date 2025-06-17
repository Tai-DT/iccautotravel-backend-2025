import { HttpException, HttpStatus, Logger } from '@nestjs/common';

export interface ErrorWithMessage {
  message: string;
  stack?: string;
  status: number; // Changed from status?: number to ensure it's always defined
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

export function getErrorStatus(error: unknown): number {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

export function formatError(
  error: unknown,
  defaultMessage: string,
): ErrorWithMessage {
  return {
    message: getErrorMessage(error) || defaultMessage,
    stack: getErrorStack(error),
    status: getErrorStatus(error), // This will always return a number now
  };
}

// Alias functions for backward compatibility
export const extractErrorMessage = getErrorMessage;
export const extractErrorStatus = getErrorStatus;

/**
 * Log an error with the NestJS Logger
 */
export function logError(
  logger: Logger,
  message: string,
  error: unknown,
): void {
  logger.error(`${message}: ${getErrorMessage(error)}`, getErrorStack(error));
}
