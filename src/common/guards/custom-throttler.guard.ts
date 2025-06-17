import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerRequest } from '@nestjs/throttler/dist/throttler.guard.interface';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Safe fallback if req is undefined
    if (!req) {
      return Promise.resolve('unknown-ip');
    }

    // Try multiple ways to get the IP address
    const ip =
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      (req.headers && req.headers['x-forwarded-for']) ||
      'unknown-ip';

    return Promise.resolve(ip);
  }

  // Get request and response properly based on context type (HTTP or GraphQL)
  protected getRequestResponse(context: ExecutionContext): {
    req: any;
    res: any;
  } {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const ctx = gqlContext.getContext();
      return { req: ctx?.req || {}, res: ctx?.res || {} };
    }
    return {
      req: context.switchToHttp().getRequest(),
      res: context.switchToHttp().getResponse(),
    };
  }

  // Override to generate a key that works for both REST and GraphQL
  protected generateKeyForRequest(
    context: ExecutionContext,
    tracker: string,
  ): string {
    let prefix = 'global';

    // Try to get method from request
    if (context.getType<GqlContextType>() === 'graphql') {
      // For GraphQL, we use the operation name or 'graphql' as the method
      prefix = 'graphql';
      try {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();
        if (
          info &&
          info.operation &&
          info.operation.name &&
          info.operation.name.value
        ) {
          prefix = `graphql-${info.operation.name.value}`;
        }
      } catch (e) {
        // Fallback to just 'graphql' if we can't get the operation name
      }
    } else {
      // For REST, use the HTTP method
      const req = context.switchToHttp().getRequest();
      prefix = req && req.method ? req.method : 'global';
    }

    // Return a key in the format "prefix-controller-handler-tracker"
    return `${prefix}-${context.getClass().name}-${context.getHandler().name}-${tracker}`;
  }

  // Override to match the base ThrottlerGuard handleRequest signature
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    try {
      const { context, limit, ttl, blockDuration, getTracker } = requestProps;

      // Get the request and response objects
      const { req, res } = this.getRequestResponse(context);

      // If we don't have a valid request, skip throttling
      if (!req) {
        return true;
      }

      // Get tracker (e.g., IP address)
      const tracker = await getTracker(req, context);

      // Generate the key using our custom method that handles both REST and GraphQL
      const key = this.generateKeyForRequest(context, tracker);

      const { totalHits, timeToExpire } = await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        context.getHandler().name,
      );

      // Set headers if response has the header function
      if (res && typeof res.header === 'function') {
        res.header('X-RateLimit-Limit', String(limit));
        res.header(
          'X-RateLimit-Remaining',
          Math.max(0, limit - totalHits).toString(),
        );
        res.header('X-RateLimit-Reset', timeToExpire.toString());
      }

      // Check if the request exceeds the rate limit
      if (totalHits > limit) {
        throw new ThrottlerException();
      }

      return true;
    } catch (error) {
      // Log the error but allow the request to proceed in development environments
      console.warn(
        'ThrottlerGuard error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return process.env.NODE_ENV !== 'production';
    }
  }

  // Override the base canActivate method to handle GraphQL contexts properly
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Early exit for graphql introspection queries
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      if (
        info &&
        info.operation &&
        info.operation.name &&
        info.operation.name.value === 'IntrospectionQuery'
      ) {
        return true;
      }
    }
    try {
      return await super.canActivate(context);
    } catch (error) {
      // Log the error but allow the request to proceed in development environments
      console.warn(
        'ThrottlerGuard error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return process.env.NODE_ENV !== 'production';
    }
  }
}
