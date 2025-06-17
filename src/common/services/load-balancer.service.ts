import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as cluster from 'cluster';
import * as os from 'os';
import Redis from 'ioredis';

interface ServerNode {
  id: string;
  host: string;
  port: number;
  weight: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  cpu: number;
  memory: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  uptime: number;
  version: string;
}

interface LoadBalancerMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  throughput: number; // requests per second
  nodeDistribution: Record<string, number>;
  healthyNodes: number;
  totalNodes: number;
  clusterUtilization: number;
}

interface HealthCheckResult {
  nodeId: string;
  healthy: boolean;
  responseTime: number;
  cpu: number;
  memory: number;
  activeConnections: number;
  errorRate: number;
  details?: any;
}

interface RequestRouting {
  nodeId: string;
  weight: number;
  expectedResponseTime: number;
  loadFactor: number;
}

@Injectable()
export class LoadBalancerService implements OnModuleInit {
  private readonly logger = new Logger(LoadBalancerService.name);
  private nodes = new Map<string, ServerNode>();
  private redis: Redis;
  private metrics: LoadBalancerMetrics;
  private algorithm:
    | 'round-robin'
    | 'weighted'
    | 'least-connections'
    | 'response-time' = 'weighted';
  private healthCheckInterval: NodeJS.Timeout;
  private currentNodeIndex = 0;
  private isMaster = false;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeMetrics();
    this.setupRedisConnection();
    this.detectClusterRole();
  }

  async onModuleInit() {
    this.logger.log('⚖️ Initializing Load Balancer Service...');

    if (this.isMaster) {
      await this.initializeMasterNode();
    } else {
      await this.initializeWorkerNode();
    }

    await this.discoverNodes();
    this.startHealthChecks();
    this.startMetricsCollection();

    this.logger.log('✅ Load Balancer Service initialized');
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      throughput: 0,
      nodeDistribution: {},
      healthyNodes: 0,
      totalNodes: 0,
      clusterUtilization: 0,
    };
  }

  /**
   * Setup Redis connection for cluster coordination
   */
  private setupRedisConnection(): void {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn(
        '🚫 Redis is disabled via DISABLE_REDIS flag - using mock cluster coordination',
      );
      // Create a mock Redis client with proper method implementations
      this.redis = new Proxy({} as Redis, {
        get: (target, prop) => {
          // Handle specific methods that need special return values
          if (prop === 'get') {
            return () => Promise.resolve(null);
          }
          if (prop === 'mget') {
            return () => Promise.resolve([]);
          }
          if (prop === 'keys') {
            return () => Promise.resolve([]);
          }
          if (prop === 'hgetall') {
            return () => Promise.resolve({});
          }
          if (prop === 'lrange') {
            return () => Promise.resolve([]);
          }
          if (prop === 'exists') {
            return () => Promise.resolve(0);
          }
          if (prop === 'ttl') {
            return () => Promise.resolve(-1);
          }
          // For all other methods, return OK or success
          return () => Promise.resolve('OK');
        },
      });
      return;
    }

    const redisUrl = this.configService.get(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.redis = new Redis(redisUrl, {
      keyPrefix: 'iccautotravel:cluster:',
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis cluster connection error:', error);
    });
  }

  /**
   * Detect if this is master or worker process
   */
  private detectClusterRole(): void {
    this.isMaster = (cluster as any).isPrimary || (cluster as any).isMaster;

    if (this.isMaster) {
      this.logger.log('👑 Running as cluster master');
    } else {
      this.logger.log('👷 Running as cluster worker');
    }
  }

  /**
   * Initialize master node
   */
  private async initializeMasterNode(): Promise<void> {
    const disableCluster = this.configService.get<boolean>('DISABLE_CLUSTER');

    if (disableCluster) {
      this.logger.warn(
        '🚫 Clustering is disabled via DISABLE_CLUSTER flag - running in single process mode',
      );
      return;
    }

    const numCPUs = os.cpus().length;
    const maxWorkers = this.configService.get('MAX_WORKERS', numCPUs);

    this.logger.log(`🚀 Starting ${maxWorkers} worker processes...`);

    // Fork worker processes
    for (let i = 0; i < maxWorkers; i++) {
      (cluster as any).fork();
    }

    // Handle worker events
    (cluster as any).on('exit', (worker: any, code: any, signal: any) => {
      this.logger.warn(
        `👷 Worker ${worker.process.pid} died (${signal || code}). Restarting...`,
      );
      (cluster as any).fork();
    });

    (cluster as any).on('online', (worker: any) => {
      this.logger.log(`✅ Worker ${worker.process.pid} online`);
    });

    // Register master node
    await this.registerNode({
      id: 'master',
      host: this.configService.get('HOST', 'localhost'),
      port: parseInt(this.configService.get('PORT', '1337')),
      weight: 1,
      health: 'healthy',
      cpu: 0,
      memory: 0,
      activeConnections: 0,
      responseTime: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  /**
   * Initialize worker node
   */
  private async initializeWorkerNode(): Promise<void> {
    const workerId = `worker-${process.pid}`;

    await this.registerNode({
      id: workerId,
      host: this.configService.get('HOST', 'localhost'),
      port: parseInt(this.configService.get('PORT', '1337')),
      weight: 1,
      health: 'healthy',
      cpu: 0,
      memory: 0,
      activeConnections: 0,
      responseTime: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });

    // Report metrics to master
    setInterval(() => {
      this.reportWorkerMetrics(workerId);
    }, 30000); // Every 30 seconds
  }

  /**
   * Register node in cluster
   */
  private async registerNode(node: ServerNode): Promise<void> {
    try {
      this.nodes.set(node.id, node);

      // Store in Redis for cluster coordination
      await this.redis.hset('nodes', node.id, JSON.stringify(node));
      await this.redis.expire('nodes', 300); // 5 minutes TTL

      this.logger.log(
        `📋 Registered node: ${node.id} (${node.host}:${node.port})`,
      );

      // Emit event
      this.eventEmitter.emit('cluster.node_registered', node);
    } catch (error) {
      this.logger.error(`❌ Failed to register node ${node.id}:`, error);
    }
  }

  /**
   * Discover nodes in cluster
   */
  private async discoverNodes(): Promise<void> {
    try {
      const nodeData = await this.redis.hgetall('nodes');

      for (const [nodeId, data] of Object.entries(nodeData)) {
        const node: ServerNode = JSON.parse(data);
        this.nodes.set(nodeId, node);
      }

      this.logger.log(`🔍 Discovered ${this.nodes.size} nodes in cluster`);
    } catch (error) {
      this.logger.error('❌ Error discovering nodes:', error);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000);

    this.logger.log('🏥 Started health check monitoring');
  }

  /**
   * Perform health checks on all nodes
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises: Promise<HealthCheckResult>[] = [];

    for (const [nodeId, node] of this.nodes.entries()) {
      if (nodeId !== 'master' && !nodeId.includes('worker')) {
        healthPromises.push(this.checkNodeHealth(node));
      }
    }

    try {
      const results = await Promise.allSettled(healthPromises);

      for (const result of results) {
        if (result.status === 'fulfilled') {
          await this.updateNodeHealth(result.value);
        }
      }

      this.updateClusterMetrics();
    } catch (error) {
      this.logger.error('❌ Error performing health checks:', error);
    }
  }

  /**
   * Check individual node health
   */
  private async checkNodeHealth(node: ServerNode): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simulate health check (would be HTTP request in real implementation)
      const response = await this.makeHealthCheckRequest(node);
      const responseTime = Date.now() - startTime;

      return {
        nodeId: node.id,
        healthy: response.status === 'ok',
        responseTime,
        cpu: response.cpu || 0,
        memory: response.memory || 0,
        activeConnections: response.connections || 0,
        errorRate: response.errorRate || 0,
        details: response,
      };
    } catch (error) {
      return {
        nodeId: node.id,
        healthy: false,
        responseTime: Date.now() - startTime,
        cpu: 100,
        memory: 100,
        activeConnections: 0,
        errorRate: 100,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Make health check request
   */
  private async makeHealthCheckRequest(node: ServerNode): Promise<any> {
    // Simulate health check response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'ok',
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          connections: Math.floor(Math.random() * 100),
          errorRate: Math.random() * 5,
        });
      }, 100);
    });
  }

  /**
   * Update node health based on check result
   */
  private async updateNodeHealth(result: HealthCheckResult): Promise<void> {
    const node = this.nodes.get(result.nodeId);
    if (!node) return;

    // Update node metrics
    node.cpu = result.cpu;
    node.memory = result.memory;
    node.activeConnections = result.activeConnections;
    node.responseTime = result.responseTime;
    node.errorRate = result.errorRate;
    node.lastHealthCheck = new Date();

    // Determine health status
    if (
      !result.healthy ||
      result.cpu > 90 ||
      result.memory > 90 ||
      result.errorRate > 20
    ) {
      node.health = 'unhealthy';
    } else if (result.cpu > 70 || result.memory > 70 || result.errorRate > 10) {
      node.health = 'degraded';
    } else {
      node.health = 'healthy';
    }

    // Update weight based on performance
    node.weight = this.calculateNodeWeight(node);

    // Store updated node
    this.nodes.set(result.nodeId, node);
    await this.redis.hset('nodes', result.nodeId, JSON.stringify(node));

    // Emit health update event
    this.eventEmitter.emit('cluster.node_health_updated', {
      nodeId: result.nodeId,
      health: node.health,
      metrics: result,
    });

    // Log critical health issues
    if (node.health === 'unhealthy') {
      this.logger.warn(
        `🚨 Node ${result.nodeId} is unhealthy: CPU=${result.cpu}%, Memory=${result.memory}%, ErrorRate=${result.errorRate}%`,
      );
    }
  }

  /**
   * Calculate node weight based on performance
   */
  private calculateNodeWeight(node: ServerNode): number {
    let weight = 1;

    // Adjust based on CPU usage
    if (node.cpu < 30) weight += 0.5;
    else if (node.cpu > 70) weight -= 0.3;
    else if (node.cpu > 90) weight -= 0.7;

    // Adjust based on memory usage
    if (node.memory < 30) weight += 0.3;
    else if (node.memory > 70) weight -= 0.2;
    else if (node.memory > 90) weight -= 0.5;

    // Adjust based on response time
    if (node.responseTime < 100) weight += 0.2;
    else if (node.responseTime > 500) weight -= 0.3;
    else if (node.responseTime > 1000) weight -= 0.5;

    // Adjust based on error rate
    if (node.errorRate < 1) weight += 0.2;
    else if (node.errorRate > 5) weight -= 0.4;
    else if (node.errorRate > 10) weight -= 0.8;

    // Ensure weight is between 0.1 and 2.0
    return Math.max(0.1, Math.min(2.0, weight));
  }

  /**
   * Route request to optimal node
   */
  async routeRequest(requestInfo?: {
    method?: string;
    path?: string;
    userAgent?: string;
    ip?: string;
  }): Promise<RequestRouting | null> {
    const healthyNodes = Array.from(this.nodes.values()).filter(
      (node) => node.health === 'healthy' || node.health === 'degraded',
    );

    if (healthyNodes.length === 0) {
      this.logger.error('❌ No healthy nodes available for routing');
      return null;
    }

    let selectedNode: ServerNode;

    switch (this.algorithm) {
      case 'round-robin':
        selectedNode = this.selectRoundRobin(healthyNodes);
        break;
      case 'weighted':
        selectedNode = this.selectWeighted(healthyNodes);
        break;
      case 'least-connections':
        selectedNode = this.selectLeastConnections(healthyNodes);
        break;
      case 'response-time':
        selectedNode = this.selectByResponseTime(healthyNodes);
        break;
      default:
        selectedNode = this.selectWeighted(healthyNodes);
    }

    // Update metrics
    this.metrics.totalRequests++;
    this.metrics.nodeDistribution[selectedNode.id] =
      (this.metrics.nodeDistribution[selectedNode.id] || 0) + 1;

    // Emit routing event
    this.eventEmitter.emit('cluster.request_routed', {
      nodeId: selectedNode.id,
      algorithm: this.algorithm,
      requestInfo,
    });

    return {
      nodeId: selectedNode.id,
      weight: selectedNode.weight,
      expectedResponseTime: selectedNode.responseTime,
      loadFactor: selectedNode.cpu / 100,
    };
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(nodes: ServerNode[]): ServerNode {
    const node = nodes[this.currentNodeIndex % nodes.length];
    this.currentNodeIndex++;
    return node;
  }

  /**
   * Weighted selection
   */
  private selectWeighted(nodes: ServerNode[]): ServerNode {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;

    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node;
      }
    }

    return nodes[0]; // Fallback
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(nodes: ServerNode[]): ServerNode {
    return nodes.reduce((best, current) =>
      current.activeConnections < best.activeConnections ? current : best,
    );
  }

  /**
   * Response time based selection
   */
  private selectByResponseTime(nodes: ServerNode[]): ServerNode {
    return nodes.reduce((best, current) =>
      current.responseTime < best.responseTime ? current : best,
    );
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectClusterMetrics();
    }, 60000); // Every minute

    this.logger.log('📊 Started cluster metrics collection');
  }

  /**
   * Collect cluster-wide metrics
   */
  private async collectClusterMetrics(): Promise<void> {
    try {
      this.updateClusterMetrics();

      // Store metrics in Redis
      await this.redis.setex(
        'cluster_metrics',
        300, // 5 minutes TTL
        JSON.stringify(this.metrics),
      );

      // Emit metrics event
      this.eventEmitter.emit('cluster.metrics_collected', this.metrics);
    } catch (error) {
      this.logger.error('❌ Error collecting cluster metrics:', error);
    }
  }

  /**
   * Update cluster metrics
   */
  private updateClusterMetrics(): void {
    const nodes = Array.from(this.nodes.values());
    const healthyNodes = nodes.filter((node) => node.health === 'healthy');

    this.metrics.healthyNodes = healthyNodes.length;
    this.metrics.totalNodes = nodes.length;

    if (nodes.length > 0) {
      const avgCpu =
        nodes.reduce((sum, node) => sum + node.cpu, 0) / nodes.length;
      const avgMemory =
        nodes.reduce((sum, node) => sum + node.memory, 0) / nodes.length;
      this.metrics.clusterUtilization = (avgCpu + avgMemory) / 2;
    }

    // Calculate throughput (simplified)
    const totalDistributed = Object.values(
      this.metrics.nodeDistribution,
    ).reduce((sum, count) => sum + count, 0);
    this.metrics.throughput = totalDistributed / 60; // Requests per second (approximate)
  }

  /**
   * Report worker metrics to master
   */
  private async reportWorkerMetrics(workerId: string): Promise<void> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      workerId,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    try {
      await this.redis.setex(
        `worker_metrics:${workerId}`,
        120,
        JSON.stringify(metrics),
      );
    } catch (error) {
      this.logger.error(
        `❌ Error reporting worker metrics for ${workerId}:`,
        error,
      );
    }
  }

  /**
   * Get cluster status
   */
  getClusterStatus(): {
    nodes: ServerNode[];
    metrics: LoadBalancerMetrics;
    algorithm: string;
    masterNode: boolean;
  } {
    return {
      nodes: Array.from(this.nodes.values()),
      metrics: this.metrics,
      algorithm: this.algorithm,
      masterNode: this.isMaster,
    };
  }

  /**
   * Set load balancing algorithm
   */
  setLoadBalancingAlgorithm(
    algorithm:
      | 'round-robin'
      | 'weighted'
      | 'least-connections'
      | 'response-time',
  ): void {
    this.algorithm = algorithm;
    this.logger.log(`⚖️ Load balancing algorithm changed to: ${algorithm}`);

    this.eventEmitter.emit('cluster.algorithm_changed', { algorithm });
  }

  /**
   * Scale cluster up/down
   */
  async scaleCluster(targetNodes: number): Promise<void> {
    if (!this.isMaster) {
      this.logger.warn('⚠️ Only master can scale cluster');
      return;
    }

    const currentWorkers = Object.keys((cluster as any).workers || {}).length;

    if (targetNodes > currentWorkers) {
      // Scale up
      const nodesToAdd = targetNodes - currentWorkers;
      this.logger.log(`📈 Scaling up: adding ${nodesToAdd} worker nodes`);

      for (let i = 0; i < nodesToAdd; i++) {
        (cluster as any).fork();
      }
    } else if (targetNodes < currentWorkers) {
      // Scale down
      const nodesToRemove = currentWorkers - targetNodes;
      this.logger.log(
        `📉 Scaling down: removing ${nodesToRemove} worker nodes`,
      );

      const workers = Object.values((cluster as any).workers || {});
      for (let i = 0; i < nodesToRemove && i < workers.length; i++) {
        (workers[i] as any).kill();
      }
    }

    this.eventEmitter.emit('cluster.scaled', {
      from: currentWorkers,
      to: targetNodes,
      action: targetNodes > currentWorkers ? 'scale_up' : 'scale_down',
    });
  }

  /**
   * Get load balancer health score
   */
  getHealthScore(): number {
    let score = 100;

    // Penalize for unhealthy nodes
    const totalNodes = this.metrics.totalNodes;
    const healthyNodes = this.metrics.healthyNodes;

    if (totalNodes > 0) {
      const healthRatio = healthyNodes / totalNodes;
      score *= healthRatio;
    }

    // Penalize for high cluster utilization
    if (this.metrics.clusterUtilization > 80) {
      score -= 20;
    } else if (this.metrics.clusterUtilization > 90) {
      score -= 40;
    }

    // Penalize for high error rate
    if (this.metrics.totalRequests > 0) {
      const errorRate =
        (this.metrics.totalErrors / this.metrics.totalRequests) * 100;
      if (errorRate > 5) score -= 30;
      else if (errorRate > 10) score -= 50;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Force cluster rebalancing
   */
  async rebalanceCluster(): Promise<void> {
    this.logger.log('⚖️ Forcing cluster rebalancing...');

    // Recalculate all node weights
    for (const [nodeId, node] of this.nodes.entries()) {
      node.weight = this.calculateNodeWeight(node);
      await this.redis.hset('nodes', nodeId, JSON.stringify(node));
    }

    this.eventEmitter.emit('cluster.rebalanced');
    this.logger.log('✅ Cluster rebalancing completed');
  }

  /**
   * Gracefully shutdown cluster
   */
  async shutdown(): Promise<void> {
    this.logger.log('🛑 Shutting down load balancer...');

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // If master, shutdown workers gracefully
    if (this.isMaster) {
      const workers = Object.values((cluster as any).workers || {});

      for (const worker of workers) {
        (worker as any).kill('SIGTERM');
      }

      // Wait for workers to shutdown
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Close Redis connection
    await this.redis.quit();

    this.logger.log('✅ Load balancer shutdown completed');
  }
}
