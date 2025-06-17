import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';

// Decorator for cache TTL
export const CACHE_TTL_KEY = 'cache_ttl';
export const GraphQLCacheTTL =
  (ttl: number) => (target: any, key?: any, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(CACHE_TTL_KEY, ttl, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(CACHE_TTL_KEY, ttl, target);
    return target;
  };

@Injectable()
export class GraphQLCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger('GraphQLCache');
  private readonly CACHE_PREFIX = 'gql:cache:';

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const args = gqlContext.getArgs();

    // Only cache queries, not mutations or subscriptions
    if (info.operation.operation !== 'query') {
      return next.handle();
    }

    // Get cache TTL from metadata
    const handler = context.getHandler();
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_KEY, handler) || 300; // 5 minutes default

    // Create cache key based on query and arguments
    const cacheKey = this.generateCacheKey(
      info.fieldName,
      args,
      info.variableValues,
    );

    try {
      // Try to get from cache first
      const cachedResult = await this.redisService.getJson(cacheKey);
      if (cachedResult) {
        this.logger.debug(`Cache hit for GraphQL query: ${info.fieldName}`);
        return of(cachedResult);
      }

      // Cache miss - execute query and cache result
      return next.handle().pipe(
        tap(async (result) => {
          if (result && !this.hasErrors(result)) {
            await this.redisService.setJson(cacheKey, result, cacheTTL);
            this.logger.debug(
              `Cached GraphQL query result: ${info.fieldName} (TTL: ${cacheTTL}s)`,
            );
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        `Cache error for GraphQL query ${info.fieldName}:`,
        error,
      );
      // Fallback to normal execution if cache fails
      return next.handle();
    }
  }

  private generateCacheKey(
    fieldName: string,
    args: any,
    variables: any,
  ): string {
    const keyData = {
      field: fieldName,
      args: args || {},
      variables: variables || {},
    };

    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    const hash = crypto
      .createHash('sha256')
      .update(keyString)
      .digest('hex')
      .substring(0, 16);

    return `${this.CACHE_PREFIX}${fieldName}:${hash}`;
  }

  private hasErrors(result: any): boolean {
    return result && result.errors && result.errors.length > 0;
  }
}
