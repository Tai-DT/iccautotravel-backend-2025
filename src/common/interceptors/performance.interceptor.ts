import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let req: Request | undefined;
    let method: string = 'UNKNOWN';
    let url: string = 'UNKNOWN';

    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const ctx = gqlContext.getContext();
      req = ctx?.req;
      if (req) {
        method = req.method || 'POST'; // GraphQL requests are typically POST
        url = req.url || '/graphql';
      }
    } else {
      req = context.switchToHttp().getRequest();
      if (req) {
        method = req.method;
        url = req.url;
      }
    }

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        if (delay > 1000) {
          // Log slow requests (>1s)
          this.logger.warn(
            `Slow request detected: ${method} ${url} - ${delay}ms`,
          );
        }
        // Log all requests in development
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`${method} ${url} took ${delay}ms`);
        }
      }),
    );
  }
}
