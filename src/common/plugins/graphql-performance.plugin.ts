import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import { GraphQLSchema, DocumentNode, print } from 'graphql';

interface PerformanceMetrics {
  queryComplexity: number;
  queryDepth: number;
  executionTime: number;
  resolverCount: number;
  cacheHits: number;
  cacheMisses: number;
}

interface QueryAnalysis {
  operationName?: string;
  query: string;
  variables?: Record<string, any>;
  complexity: number;
  depth: number;
  estimatedCost: number;
  isAllowed: boolean;
  reason?: string;
}

@Plugin()
export class GraphQLPerformancePlugin {
  private readonly logger = new Logger('GraphQLPerformance');
  private readonly maxQueryDepth = 15;
  private readonly maxQueryComplexity = 1000;
  private readonly maxQueryCost = 5000;
  private queryMetrics = new Map<string, PerformanceMetrics[]>();

  serverWillStart(): Promise<void> {
    this.logger.log('GraphQL Performance Plugin initialized');
    this.logger.log(`Max Query Depth: ${this.maxQueryDepth}`);
    this.logger.log(`Max Query Complexity: ${this.maxQueryComplexity}`);
    this.logger.log(`Max Query Cost: ${this.maxQueryCost}`);
    return Promise.resolve();
  }

  requestDidStart(requestContext: any): any {
    const startTime = Date.now();
    let queryAnalysis: QueryAnalysis | null = null;

    return {
      didResolveOperation: (requestContext: any) => {
        try {
          // Analyze query before execution
          queryAnalysis = this.analyzeQuery(
            requestContext.document!,
            requestContext.operationName,
            requestContext.request.variables,
          );

          // Block if query exceeds limits
          if (!queryAnalysis.isAllowed) {
            throw new Error(`Query blocked: ${queryAnalysis.reason}`);
          }

          // Log complex queries
          if (queryAnalysis.complexity > this.maxQueryComplexity * 0.7) {
            this.logger.warn(
              `High complexity query detected: ${queryAnalysis.complexity} (${queryAnalysis.operationName || 'anonymous'})`,
            );
          }
        } catch (error) {
          this.logger.error('Error analyzing query:', error);
          throw error;
        }
      },

      willSendResponse: (requestContext: any) => {
        try {
          const executionTime = Date.now() - startTime;

          // Record performance metrics
          if (queryAnalysis) {
            this.recordMetrics(queryAnalysis, executionTime);
          }

          // Log slow queries
          if (executionTime > 1000) {
            this.logger.warn(
              `Slow GraphQL query: ${executionTime}ms (${queryAnalysis?.operationName || 'anonymous'})`,
            );
          }

          // Add performance headers
          if (requestContext.response.http) {
            requestContext.response.http.headers.set(
              'X-GraphQL-Execution-Time',
              executionTime.toString(),
            );
            if (queryAnalysis) {
              requestContext.response.http.headers.set(
                'X-GraphQL-Complexity',
                queryAnalysis.complexity.toString(),
              );
              requestContext.response.http.headers.set(
                'X-GraphQL-Depth',
                queryAnalysis.depth.toString(),
              );
            }
          }
        } catch (error) {
          this.logger.error('Error in willSendResponse:', error);
        }
      },

      didEncounterErrors: (requestContext: any) => {
        const executionTime = Date.now() - startTime;

        for (const error of requestContext.errors) {
          this.logger.error('GraphQL Error:', {
            message: error.message,
            path: error.path,
            operationName: queryAnalysis?.operationName,
            executionTime,
            complexity: queryAnalysis?.complexity,
          });
        }
      },
    };
  }

  /**
   * Analyze query complexity, depth, and cost
   */
  private analyzeQuery(
    document: DocumentNode,
    operationName?: string,
    variables?: Record<string, any>,
  ): QueryAnalysis {
    const query = this.printQuery(document);

    // Calculate query depth
    const depth = this.calculateQueryDepth(document);

    // Calculate query complexity (simplified version)
    const complexity = this.calculateQueryComplexity(document);

    // Estimate query cost
    const estimatedCost = this.estimateQueryCost(document, variables);

    // Determine if query is allowed
    let isAllowed = true;
    let reason: string | undefined;

    if (depth > this.maxQueryDepth) {
      isAllowed = false;
      reason = `Query depth ${depth} exceeds maximum allowed depth ${this.maxQueryDepth}`;
    } else if (complexity > this.maxQueryComplexity) {
      isAllowed = false;
      reason = `Query complexity ${complexity} exceeds maximum allowed complexity ${this.maxQueryComplexity}`;
    } else if (estimatedCost > this.maxQueryCost) {
      isAllowed = false;
      reason = `Query cost ${estimatedCost} exceeds maximum allowed cost ${this.maxQueryCost}`;
    }

    return {
      operationName,
      query,
      variables,
      complexity,
      depth,
      estimatedCost,
      isAllowed,
      reason,
    };
  }

  /**
   * Calculate query depth
   */
  private calculateQueryDepth(document: DocumentNode): number {
    let maxDepth = 0;

    const calculateDepth = (selections: any[], currentDepth = 0): number => {
      let depth = currentDepth;

      for (const selection of selections) {
        if (selection.selectionSet) {
          const selectionDepth = calculateDepth(
            selection.selectionSet.selections,
            currentDepth + 1,
          );
          depth = Math.max(depth, selectionDepth);
        }
      }

      return depth;
    };

    for (const definition of document.definitions) {
      if (
        definition.kind === 'OperationDefinition' &&
        definition.selectionSet
      ) {
        const depth = calculateDepth([...definition.selectionSet.selections]);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  /**
   * Calculate query complexity (simplified scoring)
   */
  private calculateQueryComplexity(document: DocumentNode): number {
    let complexity = 0;

    const calculateComplexity = (selections: any[]): number => {
      let totalComplexity = 0;

      for (const selection of selections) {
        // Base complexity for each field
        let fieldComplexity = 1;

        // Higher complexity for certain field patterns
        if (selection.name) {
          const fieldName = selection.name.value;

          // List fields are more expensive
          if (fieldName.endsWith('s') || fieldName.includes('List')) {
            fieldComplexity *= 2;
          }

          // Nested relations are expensive
          if (selection.selectionSet) {
            fieldComplexity += calculateComplexity(
              selection.selectionSet.selections,
            );
          }
        }

        // Arguments increase complexity
        if (selection.arguments && selection.arguments.length > 0) {
          fieldComplexity += selection.arguments.length * 0.5;
        }

        totalComplexity += fieldComplexity;
      }

      return totalComplexity;
    };

    for (const definition of document.definitions) {
      if (
        definition.kind === 'OperationDefinition' &&
        definition.selectionSet
      ) {
        complexity += calculateComplexity([
          ...definition.selectionSet.selections,
        ]);
      }
    }

    return Math.round(complexity);
  }

  /**
   * Estimate query execution cost
   */
  private estimateQueryCost(
    document: DocumentNode,
    variables?: Record<string, any>,
  ): number {
    let cost = 0;

    const estimateCost = (selections: any[]): number => {
      let totalCost = 0;

      for (const selection of selections) {
        let fieldCost = 1;

        if (selection.name) {
          const fieldName = selection.name.value;

          // Database queries are expensive
          if (
            ['users', 'bookings', 'services', 'reviews'].includes(fieldName)
          ) {
            fieldCost = 10;
          }

          // Aggregation queries are very expensive
          if (
            fieldName.includes('count') ||
            fieldName.includes('sum') ||
            fieldName.includes('average')
          ) {
            fieldCost = 20;
          }

          // Nested queries multiply cost
          if (selection.selectionSet) {
            fieldCost *=
              1 + estimateCost(selection.selectionSet.selections) / 10;
          }
        }

        // Pagination arguments affect cost
        if (selection.arguments) {
          for (const arg of selection.arguments) {
            if (arg.name.value === 'first' || arg.name.value === 'limit') {
              const value = this.getArgumentValue(arg, variables);
              if (typeof value === 'number') {
                fieldCost *= Math.min(value / 10, 5); // Cap multiplier at 5x
              }
            }
          }
        }

        totalCost += fieldCost;
      }

      return totalCost;
    };

    for (const definition of document.definitions) {
      if (
        definition.kind === 'OperationDefinition' &&
        definition.selectionSet
      ) {
        cost += estimateCost([...definition.selectionSet.selections]);
      }
    }

    return Math.round(cost);
  }

  /**
   * Extract argument value considering variables
   */
  private getArgumentValue(
    argument: any,
    variables?: Record<string, any>,
  ): any {
    if (argument.value.kind === 'Variable') {
      return variables?.[argument.value.name.value];
    }

    if (argument.value.kind === 'IntValue') {
      return parseInt(argument.value.value);
    }

    return argument.value.value;
  }

  /**
   * Convert document to string
   */
  private printQuery(document: DocumentNode): string {
    try {
      return print(document);
    } catch {
      return 'Unable to parse query';
    }
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(analysis: QueryAnalysis, executionTime: number): void {
    const operationName = analysis.operationName || 'anonymous';

    if (!this.queryMetrics.has(operationName)) {
      this.queryMetrics.set(operationName, []);
    }

    const metrics = this.queryMetrics.get(operationName)!;
    metrics.push({
      queryComplexity: analysis.complexity,
      queryDepth: analysis.depth,
      executionTime,
      resolverCount: 0, // Would need resolver instrumentation
      cacheHits: 0, // Would need cache integration
      cacheMisses: 0, // Would need cache integration
    });

    // Keep only last 100 metrics per operation
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<
    string,
    {
      operationName: string;
      totalQueries: number;
      averageComplexity: number;
      averageDepth: number;
      averageExecutionTime: number;
      slowQueries: number;
    }
  > {
    const stats: Record<string, any> = {};

    for (const [operationName, metrics] of this.queryMetrics.entries()) {
      const totalQueries = metrics.length;
      const averageComplexity =
        metrics.reduce((sum, m) => sum + m.queryComplexity, 0) / totalQueries;
      const averageDepth =
        metrics.reduce((sum, m) => sum + m.queryDepth, 0) / totalQueries;
      const averageExecutionTime =
        metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
      const slowQueries = metrics.filter((m) => m.executionTime > 1000).length;

      stats[operationName] = {
        operationName,
        totalQueries,
        averageComplexity: Math.round(averageComplexity * 100) / 100,
        averageDepth: Math.round(averageDepth * 100) / 100,
        averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
        slowQueries,
      };
    }

    return stats;
  }

  /**
   * Get query complexity rules for Apollo Server
   */
  static getValidationRules() {
    return [
      // Custom validation rules would go here
      // depthLimit(15),
      // costAnalysis({ maximumCost: 5000 }),
    ];
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  resetMetrics(): void {
    this.queryMetrics.clear();
    this.logger.log('GraphQL performance metrics reset');
  }
}

export const performancePlugin = new GraphQLPerformancePlugin();
