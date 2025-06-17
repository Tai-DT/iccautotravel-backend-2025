import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const gqlHost = GqlArgumentsHost.create(host);
      const context = gqlHost.getContext();

      // Ensure context and request are properly initialized
      const request = context?.req || {};

      // Log the error with more details
      this.logger.error({
        message: 'GraphQL Error',
        exception:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        context: {
          request: {
            method: request.method || 'UNKNOWN',
            url: request.url || 'UNKNOWN',
            headers: request.headers || {},
          },
        },
      });

      // Handle different types of errors
      if (exception instanceof GraphQLError) {
        return exception;
      }

      if (exception instanceof Error) {
        return new GraphQLError(exception.message, {
          extensions: {
            code: exception.name || 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString(),
            stack:
              process.env.NODE_ENV !== 'production'
                ? exception.stack
                : undefined,
          },
        });
      }

      // Handle unknown errors
      return new GraphQLError('Internal server error', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      // If we can't create GqlArgumentsHost, this might not be a GraphQL request
      this.logger.error('Failed to process GraphQL error:', error);
      return new GraphQLError('Internal server error', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
