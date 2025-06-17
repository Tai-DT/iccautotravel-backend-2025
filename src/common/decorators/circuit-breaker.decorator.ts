import { applyDecorators, SetMetadata } from '@nestjs/common';

export const CIRCUIT_BREAKER_KEY = 'circuit-breaker';

interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringWindow?: number;
  successThreshold?: number;
}

export const UseCircuitBreaker = (options: CircuitBreakerOptions) => {
  return applyDecorators(SetMetadata(CIRCUIT_BREAKER_KEY, options));
};
