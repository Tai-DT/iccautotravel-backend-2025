import { ErrorCodes, ErrorMessages } from '../constants/error-codes';

export class BusinessException extends Error {
  constructor(
    public readonly code: keyof typeof ErrorCodes,
    public readonly message: string = ErrorMessages[code],
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'BusinessException';
  }
}

export class NotFoundException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class ValidationException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class PaymentException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class BookingException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class AuthenticationException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class AuthorizationException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}

export class IntegrationException extends BusinessException {
  constructor(code: keyof typeof ErrorCodes, details?: any) {
    super(code, ErrorMessages[code], details);
  }
}
