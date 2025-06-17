import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AdvancedSecurityService } from '../services/advanced-security.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

interface CreateAPIKeyDto {
  name: string;
  permissions: string[];
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  expiresAt?: string;
  allowedIPs?: string[];
  allowedDomains?: string[];
}

interface BanIPDto {
  reason: string;
  duration?: number; // in milliseconds
}

@Controller('security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class SecurityController {
  constructor(private readonly securityService: AdvancedSecurityService) {}

  /**
   * Get security metrics dashboard
   */
  @Get('metrics')
  async getSecurityMetrics() {
    return this.securityService.getSecurityMetrics();
  }

  /**
   * Get all banned IPs
   */
  @Get('banned-ips')
  async getBannedIPs() {
    return this.securityService.getBannedIPs();
  }

  /**
   * Ban an IP address
   */
  @Post('ban-ip/:ip')
  @HttpCode(200)
  async banIP(@Param('ip') ip: string, @Body() banData: BanIPDto) {
    await this.securityService.banIP(ip, banData.reason, banData.duration);
    return {
      message: `IP ${ip} has been banned`,
      reason: banData.reason,
      duration: banData.duration,
    };
  }

  /**
   * Unban an IP address
   */
  @Delete('ban-ip/:ip')
  async unbanIP(@Param('ip') ip: string) {
    await this.securityService.unbanIP(ip);
    return { message: `IP ${ip} has been unbanned` };
  }

  /**
   * Get all API keys
   */
  @Get('api-keys')
  async getAPIKeys() {
    return this.securityService.getAllAPIKeys();
  }

  /**
   * Create new API key
   */
  @Post('api-keys')
  async createAPIKey(@Body() createDto: CreateAPIKeyDto) {
    const expiresAt = createDto.expiresAt
      ? new Date(createDto.expiresAt)
      : undefined;

    const result = await this.securityService.createAPIKey(
      createDto.name,
      createDto.permissions,
      createDto.rateLimit,
      {
        expiresAt,
        allowedIPs: createDto.allowedIPs,
        allowedDomains: createDto.allowedDomains,
      },
    );

    return {
      message: 'API key created successfully',
      id: result.id,
      key: result.key,
      warning: 'Store this key securely. It will not be shown again.',
    };
  }

  /**
   * Revoke API key
   */
  @Delete('api-keys/:id')
  async revokeAPIKey(@Param('id') id: string) {
    const success = await this.securityService.revokeAPIKey(id);

    if (!success) {
      return { message: 'API key not found', success: false };
    }

    return { message: 'API key revoked successfully', success: true };
  }

  /**
   * Security health check
   */
  @Get('health')
  async getSecurityHealth() {
    const metrics = await this.securityService.getSecurityMetrics();
    const bannedIPs = await this.securityService.getBannedIPs();
    const apiKeys = await this.securityService.getAllAPIKeys();

    return {
      status: 'healthy',
      metrics: {
        totalRequests: metrics.totalRequests,
        blockedRequests: metrics.blockedRequests,
        blockRate:
          metrics.totalRequests > 0
            ? ((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(
                2,
              ) + '%'
            : '0%',
        suspiciousRequests: metrics.suspiciousRequests,
        activeBans: bannedIPs.filter((ban) => ban.expiry > Date.now()).length,
        totalBans: bannedIPs.length,
        activeAPIKeys: apiKeys.filter((key) => key.isActive).length,
        totalAPIKeys: apiKeys.length,
      },
      topIPs: metrics.topIPs.slice(0, 5),
      recentBans: bannedIPs.slice(0, 5),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get IP analytics
   */
  @Get('analytics/ip/:ip')
  async getIPAnalytics(@Param('ip') ip: string) {
    // This would require adding a method to the security service
    // For now, return basic info
    return {
      ip,
      message: 'IP analytics feature coming soon',
    };
  }

  /**
   * Security configuration
   */
  @Get('config')
  async getSecurityConfig() {
    return {
      message: 'Security configuration is managed via environment variables',
      availableSettings: [
        'SECURITY_MAX_REQUESTS_PER_MINUTE',
        'SECURITY_MAX_REQUESTS_PER_HOUR',
        'SECURITY_MAX_REQUESTS_PER_DAY',
        'SECURITY_SUSPICIOUS_THRESHOLD',
        'SECURITY_BAN_DURATION',
        'SECURITY_WHITELISTED_IPS',
        'SECURITY_ENABLE_GEOBLOCKING',
        'SECURITY_BLOCKED_COUNTRIES',
      ],
    };
  }

  /**
   * Trigger security cleanup
   */
  @Post('cleanup')
  @HttpCode(200)
  async triggerCleanup() {
    const result = await this.securityService.cleanupSecurityData();
    return {
      message: 'Security cleanup completed',
      cleaned: result.cleaned,
      errors: result.errors,
    };
  }

  /**
   * Test security validation (for debugging)
   */
  @Post('test-validation')
  @HttpCode(200)
  async testValidation(
    @Body()
    testData: {
      ip: string;
      userAgent: string;
      apiKey?: string;
      endpoint?: string;
    },
  ) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Test validation not available in production' };
    }

    const result = await this.securityService.validateRequest(
      testData.ip,
      testData.userAgent,
      testData.apiKey,
      testData.endpoint,
    );

    return {
      testData,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get security statistics by time period
   */
  @Get('stats')
  async getSecurityStats(
    @Query('period') period: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    // This would require time-series data storage
    // For now, return basic aggregated stats
    const metrics = await this.securityService.getSecurityMetrics();

    return {
      period,
      metrics,
      note: 'Historical statistics feature coming soon',
      timestamp: new Date().toISOString(),
    };
  }
}
