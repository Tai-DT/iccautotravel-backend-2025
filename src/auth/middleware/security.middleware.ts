import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

interface SecurityContext {
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  userId?: string;
  timestamp: number;
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  // Security thresholds
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly MAX_AUTH_FAILURES_PER_HOUR = 5;
  private readonly SUSPICIOUS_PATHS = ['/admin', '/config', '/.env', '/backup'];
  private readonly BLOCKED_USER_AGENTS = ['bot', 'crawler', 'scanner'];

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const context = this.buildSecurityContext(req);

    try {
      // Check if IP is blocked
      const isBlocked = await this.isIpBlocked(context.ip);
      if (isBlocked) {
        await this.logSecurityEvent(
          context,
          'IP_BLOCKED',
          'IP address is blocked',
        );
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Rate limiting check
      const rateLimitExceeded = await this.checkRateLimit(context);
      if (rateLimitExceeded) {
        await this.logSecurityEvent(
          context,
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded',
        );
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check for suspicious activity
      const isSuspicious = await this.detectSuspiciousActivity(context);
      if (isSuspicious) {
        await this.logSecurityEvent(
          context,
          'SUSPICIOUS_ACTIVITY',
          'Suspicious activity detected',
        );
        // Don't block but log and monitor
      }

      // Check user agent
      const isBlockedUserAgent = this.checkUserAgent(context.userAgent);
      if (isBlockedUserAgent) {
        await this.logSecurityEvent(
          context,
          'BLOCKED_USER_AGENT',
          'Blocked user agent',
        );
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Add security headers
      this.addSecurityHeaders(res);

      // Track request
      await this.trackRequest(context);

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Security middleware error:', error);
      next();
    }
  }

  private buildSecurityContext(req: Request): SecurityContext {
    return {
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: Date.now(),
    };
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private async isIpBlocked(ip: string): Promise<boolean> {
    try {
      const blockKey = `blocked_ip:${ip}`;
      const isBlocked = await this.redisService.get(blockKey);
      return !!isBlocked;
    } catch (error) {
      this.logger.error('Error checking IP block status:', error);
      return false;
    }
  }

  private async checkRateLimit(context: SecurityContext): Promise<boolean> {
    try {
      const key = `rate_limit:${context.ip}:${Math.floor(context.timestamp / 60000)}`;
      const currentCount = await this.redisService.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      if (count >= this.MAX_REQUESTS_PER_MINUTE) {
        // Auto-block IP if consistently exceeding rate limits
        await this.handleRateLimitViolation(context.ip);
        return true;
      }

      // Increment counter
      await this.redisService.set(key, (count + 1).toString(), 60);
      return false;
    } catch (error) {
      this.logger.error('Error checking rate limit:', error);
      return false;
    }
  }

  private async handleRateLimitViolation(ip: string): Promise<void> {
    try {
      const violationKey = `rate_violations:${ip}`;
      const violations = await this.redisService.get(violationKey);
      const violationCount = violations ? parseInt(violations, 10) : 0;

      if (violationCount >= 3) {
        // Block IP for 1 hour
        const blockKey = `blocked_ip:${ip}`;
        await this.redisService.set(blockKey, 'rate_limit_violations', 3600);
        this.logger.warn(
          `IP ${ip} blocked due to repeated rate limit violations`,
        );
      } else {
        // Increment violation counter
        await this.redisService.set(
          violationKey,
          (violationCount + 1).toString(),
          3600,
        );
      }
    } catch (error) {
      this.logger.error('Error handling rate limit violation:', error);
    }
  }

  private async detectSuspiciousActivity(
    context: SecurityContext,
  ): Promise<boolean> {
    try {
      let suspiciousScore = 0;

      // Check for suspicious paths
      if (this.SUSPICIOUS_PATHS.some((path) => context.path.includes(path))) {
        suspiciousScore += 3;
      }

      // Check for SQL injection patterns
      const sqlPatterns = [
        'union',
        'select',
        'drop',
        'delete',
        'insert',
        'update',
      ];
      if (
        sqlPatterns.some((pattern) =>
          context.path.toLowerCase().includes(pattern),
        )
      ) {
        suspiciousScore += 5;
      }

      // Check for XSS patterns
      const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload='];
      if (
        xssPatterns.some((pattern) =>
          context.path.toLowerCase().includes(pattern),
        )
      ) {
        suspiciousScore += 5;
      }

      // Check request frequency from same IP
      const recentRequests = await this.getRecentRequestCount(context.ip);
      if (recentRequests > 100) {
        // More than 100 requests in last 5 minutes
        suspiciousScore += 2;
      }

      // Check for directory traversal
      if (context.path.includes('../') || context.path.includes('..\\')) {
        suspiciousScore += 4;
      }

      return suspiciousScore >= 5;
    } catch (error) {
      this.logger.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  private async getRecentRequestCount(ip: string): Promise<number> {
    try {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const keys = [];

      for (let i = 0; i < 5; i++) {
        const minute = Math.floor((Date.now() - i * 60 * 1000) / 60000);
        keys.push(`rate_limit:${ip}:${minute}`);
      }

      let totalCount = 0;
      for (const key of keys) {
        const count = await this.redisService.get(key);
        totalCount += count ? parseInt(count, 10) : 0;
      }

      return totalCount;
    } catch (error) {
      this.logger.error('Error getting recent request count:', error);
      return 0;
    }
  }

  private checkUserAgent(userAgent: string): boolean {
    if (!userAgent || userAgent === 'unknown') {
      return false; // Allow unknown user agents for now
    }

    const lowerUserAgent = userAgent.toLowerCase();
    return this.BLOCKED_USER_AGENTS.some((blocked) =>
      lowerUserAgent.includes(blocked),
    );
  }

  private addSecurityHeaders(res: Response): void {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), location=()',
    );

    // API specific headers
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  private async trackRequest(context: SecurityContext): Promise<void> {
    try {
      // Store request info for analysis
      const requestData = {
        ip: context.ip,
        userAgent: context.userAgent,
        path: context.path,
        method: context.method,
        timestamp: new Date(context.timestamp),
        userId: context.userId,
      };

      // Store in Redis for short-term analysis
      const key = `request_log:${context.ip}:${context.timestamp}`;
      await this.redisService.set(key, JSON.stringify(requestData), 300); // 5 minutes

      // Store significant requests in database
      if (this.isSignificantRequest(context)) {
        await this.storeSignificantRequest(requestData);
      }
    } catch (error) {
      this.logger.error('Error tracking request:', error);
    }
  }

  private isSignificantRequest(context: SecurityContext): boolean {
    // Define what constitutes a significant request
    const significantPaths = ['/auth', '/dashboard', '/admin', '/api/v1'];
    const significantMethods = ['POST', 'PUT', 'DELETE'];

    return (
      significantPaths.some((path) => context.path.startsWith(path)) ||
      significantMethods.includes(context.method)
    );
  }

  private async storeSignificantRequest(requestData: any): Promise<void> {
    try {
      // TODO: Enable when requestLog table is added to schema
      /*
      await this.prismaService.requestLog.create({
        data: requestData,
      });
      */
    } catch (error) {
      this.logger.error('Error storing significant request:', error);
    }
  }

  private async logSecurityEvent(
    context: SecurityContext,
    eventType: string,
    description: string,
  ): Promise<void> {
    try {
      this.logger.warn(`Security Event [${eventType}]: ${description}`, {
        ip: context.ip,
        userAgent: context.userAgent,
        path: context.path,
        method: context.method,
        userId: context.userId,
      });

      // Store in database for audit
      // TODO: Enable when securityEvent table is added to schema
      /*
      await this.prismaService.securityEvent.create({
        data: {
          type: eventType,
          description,
          ip: context.ip,
          userAgent: context.userAgent,
          path: context.path,
          method: context.method,
          userId: context.userId,
          metadata: {
            timestamp: context.timestamp,
          },
          createdAt: new Date(),
        },
      });
      */
    } catch (error) {
      this.logger.error('Error logging security event:', error);
    }
  }
}
