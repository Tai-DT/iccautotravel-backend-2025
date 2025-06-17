// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service'; // Import PrismaService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService, // Inject PrismaService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    try {
      this.logger.debug(
        `Validating token for user: ${payload.email} (ID: ${payload.sub})`,
      );

      if (!payload.sub) {
        this.logger.warn('JWT payload missing user ID (sub)');
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });

      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.warn(`User is inactive: ${user.email}`);
        throw new UnauthorizedException('User account is inactive');
      }

      this.logger.debug(`User validated successfully: ${user.email}`);

      // Return user with role name for compatibility with guards
      return {
        ...user,
        roleName: user.Role?.name, // Add roleName for easy access
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `JWT validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }
}
