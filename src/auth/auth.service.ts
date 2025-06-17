// This is a test comment to trigger re-evaluation of types
import { CreateUserInput } from '../users/dto/create-user.input';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  User,
  Role as PrismaRole,
  Permission as PrismaPermission,
} from '@prisma/client';
import { DatabaseManager } from '../prisma/database-manager.service';
import { RedisService } from '../redis/redis.service';
import { SupabaseAuthService } from './supabase-auth.service';

type UserWithRoleAndPermissions = User & {
  role?: (PrismaRole & { permissions: PrismaPermission[] }) | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly invalidatedTokens: Set<string> = new Set();
  private readonly useSupabaseAuth: boolean;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private databaseManager: DatabaseManager,
    private redisService: RedisService,
    private supabaseAuthService: SupabaseAuthService,
  ) {
    // eslint-disable-next-line prettier/prettier
    this.useSupabaseAuth =
      this.configService.get<boolean>('auth.useSupabase') ?? false;
    this.logger.log(
      `Auth service initialized. Using Supabase auth: ${this.useSupabaseAuth}`,
    );
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    try {
      if (!email || !pass) {
        this.logger.warn('Email or password is missing');
        return null;
      }

      if (this.useSupabaseAuth) {
        try {
          const authData = await this.supabaseAuthService.signIn(email, pass);

          if (authData && authData.user) {
            let user = await this.usersService.findByEmail(
              authData.user.email || email,
            );

            if (!user) {
              // Create local user if not exists, assign customer role by default
              const customerRole = await this.databaseManager
                .getDatabase()
                .role.findUnique({
                  where: { name: 'Customer' },
                });
              if (!customerRole) {
                throw new Error('Customer role not found in database.');
              }

              user = await this.usersService.create({
                email: authData.user.email || email,
                password: pass,
                fullName:
                  authData.user.user_metadata?.full_name || email.split('@')[0],
                roleId: customerRole.id, // Assign roleId
                supabaseId: authData.user.id,
              });
            } else if (!user.roleId) {
              // Assign customer role if missing
              const customerRole = await this.databaseManager
                .getDatabase()
                .role.findUnique({
                  where: { name: 'Customer' },
                });
              if (customerRole) {
                user = await this.usersService.update(user.id, {
                  roleId: customerRole.id,
                });
              }
            }

            // Fetch user with role and permissions
            const userWithRole = await this.databaseManager
              .getDatabase()
              .user.findUnique({
                where: { id: user.id },
                include: {
                  Role: {
                    include: {
                      Permission: true,
                    },
                  },
                },
              });

            // Return the user with role and permissions, or null if not found
            return userWithRole || null;
          }
          this.logger.warn(
            `Supabase auth failed for ${email}: No user data returned`,
          );
          return null;
        } catch (error) {
          if (error instanceof Error) {
            this.logger.warn(
              `Supabase auth failed for ${email}: ${error.message}`,
            );
          } else {
            this.logger.warn(
              `Supabase auth failed for ${email}: Unknown error`,
            );
          }
          return null;
        }
      } else {
        const user = await this.databaseManager.getDatabase().user.findUnique({
          where: { email: email },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });
        if (!user) {
          this.logger.warn(`User not found: ${email}`);
          return null;
        }

        if (!user.isActive) {
          this.logger.warn(`Inactive user attempt: ${email}`);
          return null;
        }

        if (
          user &&
          user.password &&
          (await bcrypt.compare(pass, user.password))
        ) {
          return user; // Return the full user object with password
        } else {
          this.logger.warn(`Invalid password for user: ${email}`);
          return null;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Authentication error for ${email}:`, error.message);
      } else {
        this.logger.error(`Authentication error for ${email}:`, error);
      }
      return null;
    }
  }

  async authenticateWithSupabase(
    email: string,
    password: string,
  ): Promise<any> {
    try {
      this.logger.log(`Authenticating ${email} with Supabase directly`);

      const authData = await this.supabaseAuthService.signIn(email, password);

      if (!authData || !authData.user) {
        this.logger.warn(`Supabase authentication failed for ${email}`);
        return null;
      }

      this.logger.log(`Supabase authentication successful for ${email}`);

      let localUser = await this.usersService.findByEmail(email);

      if (!localUser) {
        this.logger.log(`Creating local reference for Supabase user ${email}`);
        try {
          const customerRole = await this.databaseManager
            .getDatabase()
            .role.findUnique({
              where: { name: 'Customer' },
            });
          if (!customerRole) {
            throw new Error('Customer role not found in database.');
          }

          const userData = {
            email: authData.user.email || email,
            password: Math.random().toString(36).slice(-10),
            fullName:
              authData.user.user_metadata?.full_name || email.split('@')[0],
            roleId: customerRole.id, // Assign roleId
            supabaseId: authData.user.id,
          };

          localUser = await this.usersService.create(
            userData as CreateUserInput,
          );
          this.logger.log(`Local reference created for ${email}`);
        } catch (error) {
          if (error instanceof Error) {
            this.logger.error(
              `Failed to create local reference for ${email}: ${error.message}`,
            );
          } else {
            this.logger.error(
              `Failed to create local reference for ${email}: Unknown error`,
            );
          }
        }
      } else {
        if (!localUser.supabaseId && authData.user.id) {
          localUser = await this.usersService.update(localUser.id, {
            supabaseId: authData.user.id,
          });
        } else if (!localUser.roleId) {
          // Assign customer role if missing
          const customerRole = await this.databaseManager
            .getDatabase()
            .role.findUnique({
              where: { name: 'Customer' },
            });
          if (customerRole) {
            localUser = await this.usersService.update(localUser.id, {
              roleId: customerRole.id,
            });
          }
        }
      }

      // Fetch localUser with role and permissions after potential updates
      const userWithRole = await this.databaseManager
        .getDatabase()
        .user.findUnique({
          where: { id: localUser?.id },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });

      return {
        user: {
          ...authData.user,
          role: userWithRole?.Role, // Use fetched role
          id: authData.user.id || userWithRole?.id,
          email: userWithRole?.email,
          fullName: userWithRole?.fullName,
          // Add other user fields as needed
        },
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Supabase authentication error for ${email}: ${error.message}`,
        );
      } else {
        this.logger.error(`Supabase authentication error for ${email}:`, error);
      }
      throw error;
    }
  }

  async register(createUserInput: CreateUserInput): Promise<User> {
    try {
      const customerRole = await this.databaseManager
        .getDatabase()
        .role.findUnique({
          where: { name: 'Customer' },
        });
      if (!customerRole) {
        throw new Error('Customer role not found in database.');
      }
      createUserInput.roleId = customerRole.id; // Assign customer role by default

      const user = await this.usersService.create(createUserInput);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Registration error for ${createUserInput.email}:`,
          error.message,
        );
      } else {
        this.logger.error(
          `Registration error for ${createUserInput.email}:`,
          error,
        );
      }
      throw error;
    }
  }

  async registerWithSupabase(createUserInput: CreateUserInput): Promise<any> {
    try {
      this.logger.log(
        `Registering user ${createUserInput.email} with Supabase`,
      );

      const customerRole = await this.databaseManager
        .getDatabase()
        .role.findUnique({
          where: { name: 'Customer' },
        });
      if (!customerRole) {
        throw new Error('Customer role not found in database.');
      }
      createUserInput.roleId = customerRole.id; // Assign customer role by default

      const userData = {
        full_name: createUserInput.fullName,
        // role: createUserInput.role, // No longer directly assign role enum
      };

      const supabaseData = await this.supabaseAuthService.signUp(
        createUserInput.email,
        createUserInput.password,
        userData,
      );

      if (!supabaseData || !supabaseData.user || !supabaseData.user.email) {
        throw new Error(
          'Failed to register user in Supabase or user email is missing',
        );
      }

      let localUser = await this.usersService.findByEmail(
        createUserInput.email,
      );

      if (!localUser) {
        localUser = await this.usersService.create({
          ...createUserInput,
          supabaseId: supabaseData.user.id,
          roleId: customerRole.id, // Ensure roleId is set here too
        });
      } else {
        if (!localUser.supabaseId && supabaseData.user.id) {
          localUser = await this.usersService.update(localUser.id, {
            supabaseId: supabaseData.user.id,
          });
        }
      }

      // Fetch localUser with role and permissions after potential updates
      const userWithRole = await this.databaseManager
        .getDatabase()
        .user.findUnique({
          where: { id: localUser?.id },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });

      return {
        user: {
          ...userWithRole,
          supabaseId: supabaseData.user.id,
        },
        session: supabaseData.session,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Supabase registration error for ${createUserInput.email}:`,
          error.message,
        );
      } else {
        this.logger.error(
          `Supabase registration error for ${createUserInput.email}:`,
          error,
        );
      }
      throw error;
    }
  }

  login(user: UserWithRoleAndPermissions): {
    accessToken: string;
    refreshToken: string;
  } {
    // Ensure user object includes role and permissions
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.name, // Only include role name in JWT payload
      permissions: user.role?.permissions?.map((p) => p.name) || [], // Include permission names
    };
    try {
      const accessToken = this.jwtService.sign(payload, {
        expiresIn:
          this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '1h',
        secret: this.configService.get('JWT_SECRET'),
      });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn:
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') || '7d',
        secret: this.configService.get('JWT_SECRET'),
      });

      // Store refresh token in Redis for revocation
      const refreshTokenTtl = this.parseTtl(
        this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') || '7d',
      );
      this.redisService.set(
        `refreshToken:${user.id}:${refreshToken}`,
        'true',
        refreshTokenTtl,
      );

      this.logger.log(`User ${user.email} logged in successfully`);
      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Login error for user ${user.email}:`, error.message);
      } else {
        this.logger.error(`Login error for user ${user.email}:`, error);
      }
      throw new UnauthorizedException('Failed to generate tokens');
    }
  }

  async refreshToken(
    user: UserWithRoleAndPermissions,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    if (await this.isTokenRevoked(user.id, user.id)) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    const newAccessToken = this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
        role: user.role?.name, // Ensure role is included in refresh token payload
        permissions: user.role?.permissions?.map((p) => p.name) || [], // Include permission names
      },
      {
        expiresIn:
          this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME') || '1h',
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    // Optionally generate a new refresh token as well, and revoke the old one
    const newRefreshToken = this.jwtService.sign(
      {
        email: user.email,
        sub: user.id,
        role: user.role?.name, // Ensure role is included in refresh token payload
        permissions: user.role?.permissions?.map((p) => p.name) || [], // Include permission names
      },
      {
        expiresIn:
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') || '7d',
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    // Revoke the old refresh token (assuming user.id is the old token)
    await this.revokeTokens(user.id, user.id); // Assuming user.id is the old token to revoke.

    // Store new refresh token in Redis for revocation
    const refreshTokenTtl = this.parseTtl(
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') || '7d',
    );
    this.redisService.set(
      `refreshToken:${user.id}:${newRefreshToken}`,
      'true',
      refreshTokenTtl,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async refreshSupabaseToken(refreshToken: string): Promise<any> {
    try {
      const authData =
        await this.supabaseAuthService.refreshToken(refreshToken);

      if (!authData || !authData.session || !authData.user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      let localUser = await this.usersService.findBySupabaseId(
        authData.user.id,
      );
      if (!localUser) {
        // Fallback to email if supabaseId not found
        localUser = await this.usersService.findByEmail(
          authData.user.email || '',
        );
      }

      if (!localUser) {
        throw new UnauthorizedException(
          'Local user not found for Supabase user',
        );
      }

      // Fetch user with role and permissions
      const userWithRole = await this.databaseManager
        .getDatabase()
        .user.findUnique({
          where: { id: localUser.id },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });

      return {
        user: {
          ...authData.user,
          role: userWithRole?.Role, // Use fetched role
          id: userWithRole?.id,
          email: userWithRole?.email,
          fullName: userWithRole?.fullName,
        },
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Supabase token refresh error: ${error.message}`);
      } else {
        this.logger.error(`Supabase token refresh error:`, error);
      }
      throw new UnauthorizedException('Failed to refresh Supabase token');
    }
  }

  async validateToken(
    token: string,
  ): Promise<UserWithRoleAndPermissions | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      if (!payload || !payload.sub) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await this.databaseManager.getDatabase().user.findUnique({
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
        return null;
      }

      // Check if access token is revoked (optional, if you want to revoke access tokens)
      if (await this.isTokenRevoked(user.id, token)) {
        return null;
      }

      return user as UserWithRoleAndPermissions;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Token validation error: ${error.message}`);
      } else {
        this.logger.error(`Token validation error:`, error);
      }
      return null;
    }
  }

  async revokeTokens(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.redisService.del(`refreshToken:${userId}:${refreshToken}`);
      this.logger.log(`Refresh token revoked for user ${userId}`);
    } else {
      // Revoke all refresh tokens for a user
      const keys = await this.redisService.keys(`refreshToken:${userId}:*`);
      if (keys.length > 0) {
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`All refresh tokens revoked for user ${userId}`);
      }
    }
  }

  async isTokenRevoked(userId: string, refreshToken: string): Promise<boolean> {
    const revoked = await this.redisService.get(
      `refreshToken:${userId}:${refreshToken}`,
    );
    return revoked === null; // If it's null, it means it's not in Redis, so it's considered revoked (or never issued).
  }

  parseTtl(ttl: string): number {
    // Basic parsing for string like '1h', '7d', '30m', etc.
    const value = parseInt(ttl.slice(0, -1));
    const unit = ttl.slice(-1);
    switch (unit) {
      case 'h':
        return value * 60 * 60; // seconds
      case 'd':
        return value * 24 * 60 * 60; // seconds
      case 'm':
        return value * 60; // seconds
      default:
        return value; // Assume seconds if no unit
    }
  }

  async syncUserWithSupabase(
    userId: string,
    supabaseAccessToken: string,
  ): Promise<UserWithRoleAndPermissions> {
    try {
      const supabaseUser =
        await this.supabaseAuthService.getUser(supabaseAccessToken);
      if (!supabaseUser) {
        throw new BadRequestException('Supabase user not found.');
      }

      let localUser = await this.usersService.findBySupabaseId(supabaseUser.id);

      if (!localUser) {
        // If local user doesn't exist, create one
        const customerRole = await this.databaseManager
          .getDatabase()
          .role.findUnique({
            where: { name: 'Customer' },
          });
        if (!customerRole) {
          throw new Error('Customer role not found in database.');
        }
        localUser = await this.usersService.create({
          email: supabaseUser.email || '',
          password: Math.random().toString(36).slice(-10), // Dummy password
          fullName:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.email?.split('@')[0] ||
            'User',
          supabaseId: supabaseUser.id,
          roleId: customerRole.id, // Assign customer role
        });
      } else {
        // Update existing local user with latest Supabase info if needed
        const updateData: any = {};
        if (supabaseUser.email && localUser.email !== supabaseUser.email) {
          updateData.email = supabaseUser.email;
        }
        if (
          supabaseUser.user_metadata?.full_name &&
          localUser.fullName !== supabaseUser.user_metadata?.full_name
        ) {
          updateData.fullName = supabaseUser.user_metadata?.full_name;
        }
        if (Object.keys(updateData).length > 0) {
          localUser = await this.usersService.update(localUser.id, updateData);
        }
      }

      // Fetch user with role and permissions after sync
      const userWithRole = await this.databaseManager
        .getDatabase()
        .user.findUnique({
          where: { id: localUser.id },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });

      return userWithRole!;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error syncing user with Supabase:`, error.message);
      } else {
        this.logger.error(`Error syncing user with Supabase:`, error);
      }
      throw new BadRequestException('Failed to sync user with Supabase');
    }
  }

  async updateSupabaseUserMetadata(
    accessToken: string,
    metadata: any,
  ): Promise<any> {
    try {
      const response = await this.supabaseAuthService.updateUserData(
        accessToken,
        metadata,
      );
      this.logger.log('Supabase user metadata updated successfully');
      return response;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error updating Supabase user metadata: ${error.message}`,
        );
      } else {
        this.logger.error(`Error updating Supabase user metadata:`, error);
      }
      throw new BadRequestException('Failed to update Supabase user metadata');
    }
  }

  async verifySupabaseToken(accessToken: string): Promise<any> {
    try {
      const user = await this.supabaseAuthService.getUser(accessToken);
      const session = null; // Session info not available from getUser

      if (!user) {
        throw new UnauthorizedException('Invalid Supabase token');
      }

      let localUser = await this.usersService.findBySupabaseId(user.id);

      if (!localUser) {
        // If local user does not exist, create a reference
        const customerRole = await this.databaseManager
          .getDatabase()
          .role.findUnique({
            where: { name: 'Customer' },
          });
        if (!customerRole) {
          throw new Error('Customer role not found in database.');
        }
        localUser = await this.usersService.create({
          email: user.email || '',
          password: Math.random().toString(36).slice(-10), // Dummy password
          fullName:
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'User',
          supabaseId: user.id,
          roleId: customerRole.id, // Assign customer role
        });
      } else if (!localUser.roleId) {
        // Assign customer role if missing
        const customerRole = await this.databaseManager
          .getDatabase()
          .role.findUnique({
            where: { name: 'Customer' },
          });
        if (customerRole) {
          localUser = await this.usersService.update(localUser.id, {
            roleId: customerRole.id,
          });
        }
      }

      // Fetch localUser with role and permissions after potential updates
      const userWithRole = await this.databaseManager
        .getDatabase()
        .user.findUnique({
          where: { id: localUser.id },
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        });

      return {
        user: {
          ...user,
          role: userWithRole?.Role, // Use fetched role
          id: userWithRole?.id,
          email: userWithRole?.email,
          fullName: userWithRole?.fullName,
        },
        session,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Supabase token verification error: ${error.message}`,
        );
      } else {
        this.logger.error(`Supabase token verification error:`, error);
      }
      throw new UnauthorizedException('Supabase token verification failed');
    }
  }

  handleAuthCallback(user: any) {
    // This method might be used for OAuth callbacks if implemented
    this.logger.log(`Handling auth callback for user: ${user.email}`);
    return user; // Or generate tokens, etc.
  }

  handleSupabaseAuth(supabaseUser: any) {
    this.logger.log(`Handling Supabase auth for user: ${supabaseUser.email}`);
    return supabaseUser;
  }
}
