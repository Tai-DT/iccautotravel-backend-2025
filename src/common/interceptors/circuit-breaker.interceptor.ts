import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { CIRCUIT_BREAKER_KEY } from '../decorators/circuit-breaker.decorator';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const circuitConfig = this.reflector.get(
      CIRCUIT_BREAKER_KEY,
      context.getHandler(),
    );

    if (!circuitConfig) {
      return next.handle();
    }

    const { name, ...config } = circuitConfig;

    try {
      const result = await this.circuitBreakerService.executeWithCircuitBreaker(
        name,
        () => next.handle().toPromise(),
        config,
      );

      return new Observable((observer) => {
        observer.next(result);
        observer.complete();
      });
    } catch (error) {
      throw error;
    }
  }
}
