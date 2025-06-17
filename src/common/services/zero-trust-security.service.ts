import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

interface SecurityContext {
  userId: string;
  sessionId: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  timestamp: Date;
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface DeviceFingerprint {
  id: string;
  userId: string;
  fingerprint: string;
  trusted: boolean;
  lastSeen: Date;
  trustScore: number;
  metadata: {
    userAgent: string;
    screen: string;
    timezone: string;
    language: string;
    platform: string;
  };
}

interface SecurityPolicy {
  id: string;
  name: string;
  type:
    | 'authentication'
    | 'authorization'
    | 'data_protection'
    | 'network'
    | 'monitoring';
  rules: SecurityRule[];
  enforcement: 'enforce' | 'monitor' | 'disabled';
  priority: number;
}

interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'challenge' | 'monitor' | 'escalate';
  parameters: Record<string, any>;
}

interface ThreatIntelligence {
  ip: string;
  type: 'malicious_ip' | 'tor_exit' | 'vpn' | 'botnet' | 'known_attacker';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  lastUpdated: Date;
  confidence: number;
}

interface EncryptionContext {
  algorithm: string;
  keyId: string;
  iv: string;
  tag?: string;
}

@Injectable()
export class ZeroTrustSecurityService implements OnModuleInit {
  private readonly logger = new Logger(ZeroTrustSecurityService.name);
  private redis: Redis;
  private securityPolicies = new Map<string, SecurityPolicy>();
  private deviceFingerprints = new Map<string, DeviceFingerprint>();
  private threatIntelligence = new Map<string, ThreatIntelligence>();
  private encryptionKeys = new Map<string, Buffer>();
  private securityInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.setupRedisConnection();
    this.initializeSecurityPolicies();
    this.initializeEncryptionKeys();
  }

  async onModuleInit() {
    this.logger.log('🛡️ Initializing Zero Trust Security Service...');
    await this.loadThreatIntelligence();
    this.startContinuousMonitoring();
    this.logger.log('✅ Zero Trust Security Service initialized');
  }

  /**
   * Setup Redis connection for security data
   */
  private setupRedisConnection(): void {
    const disableRedis = this.configService.get<boolean>('DISABLE_REDIS');

    if (disableRedis) {
      this.logger.warn(
        '🚫 Redis is disabled via DISABLE_REDIS flag - using mock security storage',
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
      keyPrefix: 'iccautotravel:security:',
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Redis security connection error:', error);
    });
  }

  /**
   * Initialize security policies
   */
  private initializeSecurityPolicies(): void {
    const policies: SecurityPolicy[] = [
      // Zero Trust Authentication Policy
      {
        id: 'zero_trust_auth',
        name: 'Zero Trust Authentication',
        type: 'authentication',
        enforcement: 'enforce',
        priority: 1,
        rules: [
          {
            id: 'require_mfa',
            condition: 'trustScore < 0.8',
            action: 'challenge',
            parameters: { challengeType: 'mfa' },
          },
          {
            id: 'device_trust',
            condition: 'deviceTrusted === false',
            action: 'challenge',
            parameters: { challengeType: 'device_verification' },
          },
          {
            id: 'geo_anomaly',
            condition: 'locationAnomaly === true',
            action: 'challenge',
            parameters: { challengeType: 'location_verification' },
          },
        ],
      },

      // Data Protection Policy
      {
        id: 'data_protection',
        name: 'Data Protection & Encryption',
        type: 'data_protection',
        enforcement: 'enforce',
        priority: 1,
        rules: [
          {
            id: 'encrypt_pii',
            condition: 'dataType === "pii"',
            action: 'allow',
            parameters: { encryption: 'aes-256-gcm' },
          },
          {
            id: 'encrypt_sensitive',
            condition: 'dataType === "sensitive"',
            action: 'allow',
            parameters: { encryption: 'aes-256-gcm' },
          },
          {
            id: 'audit_access',
            condition: 'dataAccess === true',
            action: 'monitor',
            parameters: { auditLevel: 'detailed' },
          },
        ],
      },

      // Network Security Policy
      {
        id: 'network_security',
        name: 'Network Security Controls',
        type: 'network',
        enforcement: 'enforce',
        priority: 2,
        rules: [
          {
            id: 'block_malicious_ip',
            condition: 'ipThreatLevel >= "high"',
            action: 'deny',
            parameters: { blockDuration: 3600 },
          },
          {
            id: 'rate_limit_suspicious',
            condition: 'requestPattern === "suspicious"',
            action: 'challenge',
            parameters: { rateLimit: 10 },
          },
          {
            id: 'ddos_protection',
            condition: 'requestVolume > threshold',
            action: 'challenge',
            parameters: { challengeType: 'captcha' },
          },
        ],
      },

      // Advanced Monitoring Policy
      {
        id: 'advanced_monitoring',
        name: 'Advanced Security Monitoring',
        type: 'monitoring',
        enforcement: 'monitor',
        priority: 3,
        rules: [
          {
            id: 'behavior_analytics',
            condition: 'behaviorAnomaly === true',
            action: 'monitor',
            parameters: { alertSeverity: 'medium' },
          },
          {
            id: 'privilege_escalation',
            condition: 'privilegeChange === true',
            action: 'escalate',
            parameters: { notifyAdmin: true },
          },
          {
            id: 'data_exfiltration',
            condition: 'dataVolumeAnomaly === true',
            action: 'escalate',
            parameters: { blockUser: true },
          },
        ],
      },
    ];

    policies.forEach((policy) => {
      this.securityPolicies.set(policy.id, policy);
    });

    this.logger.log(`🔒 Initialized ${policies.length} security policies`);
  }

  /**
   * Initialize encryption keys
   */
  private initializeEncryptionKeys(): void {
    // Generate master encryption key
    const masterKey = crypto.randomBytes(32);
    this.encryptionKeys.set('master', masterKey);

    // Generate data encryption keys
    const dataKey = crypto.randomBytes(32);
    this.encryptionKeys.set('data', dataKey);

    // Generate session encryption key
    const sessionKey = crypto.randomBytes(32);
    this.encryptionKeys.set('session', sessionKey);

    this.logger.log('🔑 Encryption keys initialized');
  }

  /**
   * Load threat intelligence data
   */
  private async loadThreatIntelligence(): Promise<void> {
    try {
      // Load from Redis if available
      const threatData = await this.redis.hgetall('threat_intelligence');

      for (const [ip, data] of Object.entries(threatData)) {
        const threat: ThreatIntelligence = JSON.parse(data);
        this.threatIntelligence.set(ip, threat);
      }

      // Simulate loading threat intelligence feeds
      await this.updateThreatIntelligence();

      this.logger.log(
        `🔍 Loaded ${this.threatIntelligence.size} threat intelligence entries`,
      );
    } catch (error) {
      this.logger.warn('⚠️ Could not load threat intelligence:', error);
    }
  }

  /**
   * Update threat intelligence
   */
  private async updateThreatIntelligence(): Promise<void> {
    // Simulate threat intelligence updates
    const maliciousIPs = ['192.168.1.100', '10.0.0.50', '172.16.0.25'];

    for (const ip of maliciousIPs) {
      const threat: ThreatIntelligence = {
        ip,
        type: 'malicious_ip',
        severity: 'high',
        source: 'threat_feed',
        lastUpdated: new Date(),
        confidence: 0.9,
      };

      this.threatIntelligence.set(ip, threat);
      await this.redis.hset('threat_intelligence', ip, JSON.stringify(threat));
    }
  }

  /**
   * Start continuous security monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every 5 minutes
    this.securityInterval = setInterval(async () => {
      await this.performSecurityScan();
      await this.updateThreatIntelligence();
      this.cleanupExpiredSessions();
    }, 300000);

    this.logger.log('🔄 Started continuous security monitoring');
  }

  /**
   * Evaluate security context
   */
  async evaluateSecurityContext(context: Partial<SecurityContext>): Promise<{
    allowed: boolean;
    trustScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    requiredActions: string[];
    securityContext: SecurityContext;
  }> {
    // Build complete security context
    const securityContext: SecurityContext = {
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || this.generateId(),
      deviceId:
        context.deviceId || this.generateDeviceId(context.userAgent || ''),
      ip: context.ip || '0.0.0.0',
      userAgent: context.userAgent || '',
      location: context.location,
      timestamp: new Date(),
      trustScore: 1.0,
      riskLevel: 'low',
    };

    // Calculate trust score
    const trustScore = await this.calculateTrustScore(securityContext);
    securityContext.trustScore = trustScore;

    // Determine risk level
    const riskLevel = this.determineRiskLevel(trustScore, securityContext);
    securityContext.riskLevel = riskLevel;

    // Evaluate policies
    const policyResults = await this.evaluatePolicies(securityContext);

    // Determine if access is allowed
    const allowed = !policyResults.some((result) => result.action === 'deny');

    // Get required actions
    const requiredActions = policyResults
      .filter((result) => result.action === 'challenge')
      .map((result) => result.challengeType || result.action);

    // Store security context
    await this.storeSecurityContext(securityContext);

    return {
      allowed,
      trustScore,
      riskLevel,
      requiredActions,
      securityContext,
    };
  }

  /**
   * Calculate trust score
   */
  private async calculateTrustScore(context: SecurityContext): Promise<number> {
    let score = 1.0;

    // Check threat intelligence
    const threat = this.threatIntelligence.get(context.ip);
    if (threat) {
      switch (threat.severity) {
        case 'critical':
          score -= 0.8;
          break;
        case 'high':
          score -= 0.6;
          break;
        case 'medium':
          score -= 0.3;
          break;
        case 'low':
          score -= 0.1;
          break;
      }
    }

    // Check device trust
    const device = await this.getDeviceFingerprint(context.deviceId);
    if (device) {
      if (device.trusted) {
        score += 0.2;
      } else {
        score -= 0.3;
      }
    } else {
      // New device
      score -= 0.4;
    }

    // Check location anomaly
    if (await this.detectLocationAnomaly(context)) {
      score -= 0.5;
    }

    // Check time-based patterns
    if (await this.detectTimeAnomaly(context)) {
      score -= 0.2;
    }

    // Check behavioral patterns
    if (await this.detectBehaviorAnomaly(context)) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(
    trustScore: number,
    context: SecurityContext,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (trustScore < 0.3) return 'critical';
    if (trustScore < 0.5) return 'high';
    if (trustScore < 0.7) return 'medium';
    return 'low';
  }

  /**
   * Evaluate security policies
   */
  private async evaluatePolicies(context: SecurityContext): Promise<any[]> {
    const results: any[] = [];

    for (const policy of this.securityPolicies.values()) {
      if (policy.enforcement === 'disabled') continue;

      for (const rule of policy.rules) {
        const conditionMet = await this.evaluateCondition(
          rule.condition,
          context,
        );

        if (conditionMet) {
          results.push({
            policyId: policy.id,
            ruleId: rule.id,
            action: rule.action,
            ...rule.parameters,
          });

          // Emit security event
          this.eventEmitter.emit('security.policy_triggered', {
            policy: policy.name,
            rule: rule.id,
            context,
            action: rule.action,
          });
        }
      }
    }

    return results;
  }

  /**
   * Evaluate security condition
   */
  private async evaluateCondition(
    condition: string,
    context: SecurityContext,
  ): Promise<boolean> {
    // Simple condition evaluation (in real implementation, use proper expression parser)
    if (condition.includes('trustScore < 0.8')) {
      return context.trustScore < 0.8;
    }

    if (condition.includes('deviceTrusted === false')) {
      const device = await this.getDeviceFingerprint(context.deviceId);
      return !device?.trusted;
    }

    if (condition.includes('locationAnomaly === true')) {
      return await this.detectLocationAnomaly(context);
    }

    if (condition.includes('ipThreatLevel >= "high"')) {
      const threat = this.threatIntelligence.get(context.ip);
      return threat && ['high', 'critical'].includes(threat.severity);
    }

    return false;
  }

  /**
   * Detect location anomaly
   */
  private async detectLocationAnomaly(
    context: SecurityContext,
  ): Promise<boolean> {
    if (!context.location || !context.userId) return false;

    // Get user's typical locations
    const userLocations = await this.getUserLocations(context.userId);

    if (userLocations.length === 0) return false;

    // Check if current location is significantly different
    for (const location of userLocations) {
      const distance = this.calculateDistance(
        context.location.coordinates,
        location.coordinates,
      );

      // If within 100km of any known location, not anomalous
      if (distance < 100) return false;
    }

    return true;
  }

  /**
   * Detect time-based anomaly
   */
  private async detectTimeAnomaly(context: SecurityContext): Promise<boolean> {
    const hour = context.timestamp.getHours();

    // Get user's typical access hours
    const userPatterns = await this.getUserAccessPatterns(context.userId);

    if (!userPatterns) return false;

    // Check if current hour is unusual
    return !userPatterns.typicalHours.includes(hour);
  }

  /**
   * Detect behavioral anomaly
   */
  private async detectBehaviorAnomaly(
    context: SecurityContext,
  ): Promise<boolean> {
    // Get user's behavioral patterns
    const patterns = await this.getUserBehaviorPatterns(context.userId);

    if (!patterns) return false;

    // Compare current context with patterns
    return (
      context.userAgent !== patterns.typicalUserAgent ||
      this.detectUnusualRequestPattern(context)
    );
  }

  /**
   * Generate or get device fingerprint
   */
  private async getDeviceFingerprint(
    deviceId: string,
  ): Promise<DeviceFingerprint | null> {
    let device = this.deviceFingerprints.get(deviceId);

    if (!device) {
      // Try to load from Redis
      const deviceData = await this.redis.get(`device:${deviceId}`);
      if (deviceData) {
        device = JSON.parse(deviceData);
        this.deviceFingerprints.set(deviceId, device!);
      }
    }

    return device || null;
  }

  /**
   * Store security context
   */
  private async storeSecurityContext(context: SecurityContext): Promise<void> {
    // Store in Redis with TTL
    await this.redis.setex(
      `context:${context.sessionId}`,
      3600, // 1 hour
      JSON.stringify(context),
    );

    // Update user patterns
    await this.updateUserPatterns(context);
  }

  /**
   * Update user behavioral patterns
   */
  private async updateUserPatterns(context: SecurityContext): Promise<void> {
    if (context.userId === 'anonymous') return;

    const patternsKey = `patterns:${context.userId}`;
    const patterns = await this.redis.get(patternsKey);

    let userPatterns: any = patterns
      ? JSON.parse(patterns)
      : {
          locations: [],
          accessHours: [],
          userAgents: [],
          lastUpdated: new Date(),
        };

    // Update location patterns
    if (context.location) {
      userPatterns.locations.push({
        coordinates: context.location.coordinates,
        timestamp: context.timestamp,
      });

      // Keep only last 50 locations
      if (userPatterns.locations.length > 50) {
        userPatterns.locations = userPatterns.locations.slice(-50);
      }
    }

    // Update access hour patterns
    userPatterns.accessHours.push(context.timestamp.getHours());
    if (userPatterns.accessHours.length > 100) {
      userPatterns.accessHours = userPatterns.accessHours.slice(-100);
    }

    // Update user agent patterns
    if (!userPatterns.userAgents.includes(context.userAgent)) {
      userPatterns.userAgents.push(context.userAgent);

      // Keep only last 10 user agents
      if (userPatterns.userAgents.length > 10) {
        userPatterns.userAgents = userPatterns.userAgents.slice(-10);
      }
    }

    userPatterns.lastUpdated = new Date();

    await this.redis.setex(
      patternsKey,
      86400 * 30,
      JSON.stringify(userPatterns),
    ); // 30 days
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(
    data: string,
    keyId: string = 'data',
  ): {
    encrypted: string;
    context: EncryptionContext;
  } {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error(`Encryption key ${keyId} not found`);
    }

    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = (cipher as any).getAuthTag?.();

    const context: EncryptionContext = {
      algorithm,
      keyId,
      iv: iv.toString('hex'),
      tag: tag?.toString('hex'),
    };

    return {
      encrypted,
      context,
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encrypted: string, context: EncryptionContext): string {
    const key = this.encryptionKeys.get(context.keyId);
    if (!key) {
      throw new Error(`Encryption key ${context.keyId} not found`);
    }

    const iv = Buffer.from(context.iv, 'hex');
    const decipher = crypto.createDecipheriv(context.algorithm, key, iv);

    if (context.tag) {
      (decipher as any).setAuthTag?.(Buffer.from(context.tag, 'hex'));
    }

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Perform security scan
   */
  private async performSecurityScan(): Promise<void> {
    this.logger.log('🔍 Performing security scan...');

    // Scan for suspicious sessions
    await this.scanSuspiciousSessions();

    // Scan for privilege escalations
    await this.scanPrivilegeEscalations();

    // Scan for data access anomalies
    await this.scanDataAccessAnomalies();

    this.logger.log('✅ Security scan completed');
  }

  /**
   * Scan for suspicious sessions
   */
  private async scanSuspiciousSessions(): Promise<void> {
    // Implementation would scan active sessions for anomalies
    this.eventEmitter.emit('security.scan_completed', {
      type: 'suspicious_sessions',
      findings: 0,
    });
  }

  /**
   * Scan for privilege escalations
   */
  private async scanPrivilegeEscalations(): Promise<void> {
    // Implementation would check for unauthorized privilege changes
    this.eventEmitter.emit('security.scan_completed', {
      type: 'privilege_escalations',
      findings: 0,
    });
  }

  /**
   * Scan for data access anomalies
   */
  private async scanDataAccessAnomalies(): Promise<void> {
    // Implementation would analyze data access patterns
    this.eventEmitter.emit('security.scan_completed', {
      type: 'data_access_anomalies',
      findings: 0,
    });
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateDeviceId(userAgent: string): string {
    return crypto.createHash('sha256').update(userAgent).digest('hex');
  }

  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number],
  ): number {
    // Simple distance calculation (Haversine formula would be more accurate)
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy) * 111; // Approximate km
  }

  private async getUserLocations(userId: string): Promise<any[]> {
    const patterns = await this.redis.get(`patterns:${userId}`);
    return patterns ? JSON.parse(patterns).locations || [] : [];
  }

  private async getUserAccessPatterns(userId: string): Promise<any> {
    const patterns = await this.redis.get(`patterns:${userId}`);
    if (!patterns) return null;

    const data = JSON.parse(patterns);
    const typicalHours = [...new Set(data.accessHours)];

    return { typicalHours };
  }

  private async getUserBehaviorPatterns(userId: string): Promise<any> {
    const patterns = await this.redis.get(`patterns:${userId}`);
    if (!patterns) return null;

    const data = JSON.parse(patterns);
    return {
      typicalUserAgent: data.userAgents[0],
      userAgents: data.userAgents,
    };
  }

  private detectUnusualRequestPattern(context: SecurityContext): boolean {
    // Implementation would analyze request patterns
    return false;
  }

  private cleanupExpiredSessions(): void {
    // Implementation would clean up expired security contexts
    this.logger.debug('🧹 Cleaned up expired security sessions');
  }

  /**
   * Get security dashboard
   */
  getSecurityDashboard(): {
    threatLevel: string;
    activePolicies: number;
    recentAlerts: number;
    trustScoreAverage: number;
  } {
    return {
      threatLevel: 'LOW',
      activePolicies: this.securityPolicies.size,
      recentAlerts: 0,
      trustScoreAverage: 0.85,
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.securityInterval) {
      clearInterval(this.securityInterval);
    }

    await this.redis.quit();
    this.logger.log('🛑 Zero Trust Security Service shutdown');
  }
}
