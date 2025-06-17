import { CreateUserInput } from '../users/dto/create-user.input';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseManager } from '../prisma/database-manager.service';
import { Prisma, User, Role, Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogEvent } from '../audit-log/enums/audit-log-event.enum';
import { GetUserAnalyticsInput } from '../dashboard/dto/get-user-analytics.input';
import { UserStatus } from '../dashboard/enums/user-status.enum';
import { v4 as uuidv4 } from 'uuid';

type UserWithRoleAndPermissions = User & {
  role?: (Role & { permissions: Permission[] }) | null;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private databaseManager: DatabaseManager,
    private auditLogService: AuditLogService,
  ) {}

  async create(data: CreateUserInput): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.databaseManager.getDatabase().user.create({
        data: {
          id: uuidv4(),
          email: data.email,
          fullName: data.fullName,
          password: hashedPassword,
          role: data.roleId ? { connect: { id: data.roleId } } : undefined,
          supabaseId: data.supabaseId,
          customerType: data.customerType,
          taxCode: data.taxCode,
          companyName: data.companyName,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          isActive: data.isActive,
          language: data.language,
          licenseNumber: data.licenseNumber,
          licenseClass: data.licenseClass,
          licenseExpiry: data.licenseExpiry,
          experience: data.experience,
          languages: data.languages ? { set: data.languages } : undefined,
          bio: data.bio,
          rating: data.rating,
          driverStatus: data.driverStatus,
          updatedAt: new Date(),
        } as Prisma.UserCreateInput,
      });
      await this.auditLogService.log(user.id, AuditLogEvent.USER_CREATED, {
        details: `User created: ${user.email}`,
      });
      return user;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists.');
        }
      }
      this.logger.error(
        `Failed to create user: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not create user');
    }
  }

  async findAll(
    _paginationDto?: any,
    _userFilterDto?: any,
  ): Promise<UserWithRoleAndPermissions[]> {
    try {
      return this.databaseManager.getDatabase().user.findMany({
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find all users: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve users');
    }
  }

  async findAllWithPagination(
    paginationDto: any,
    userFilterDto?: any,
  ): Promise<{ data: UserWithRoleAndPermissions[]; total: number }> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (userFilterDto?.role) {
        where.role = { name: userFilterDto.role };
      }

      const [data, total] = await Promise.all([
        this.databaseManager.getDatabase().user.findMany({
          skip,
          take: limit,
          where,
          include: {
            Role: {
              include: {
                Permission: true,
              },
            },
          },
        }),
        this.databaseManager.getDatabase().user.count({ where }),
      ]);

      return { data, total };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find users with pagination: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve users');
    }
  }

  async findOne(id: string): Promise<UserWithRoleAndPermissions | null> {
    try {
      const user = await this.databaseManager.getDatabase().user.findUnique({
        where: { id },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found.`);
      }
      return user;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find user by ID ${id}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve user');
    }
  }

  async findByEmail(email: string): Promise<UserWithRoleAndPermissions | null> {
    try {
      const user = await this.databaseManager.getDatabase().user.findUnique({
        where: { email },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });
      return user;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find user by email ${email}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve user');
    }
  }

  async findBySupabaseId(
    supabaseId: string,
  ): Promise<UserWithRoleAndPermissions | null> {
    try {
      const user = await this.databaseManager.getDatabase().user.findUnique({
        where: { supabaseId },
        include: {
          Role: {
            include: {
              Permission: true,
            },
          },
        },
      });
      return user;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find user by Supabase ID ${supabaseId}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve user by Supabase ID');
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      const updateData: Prisma.UserUpdateInput = {};

      if (data.password !== undefined && data.password !== null) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      if (data.email !== undefined && data.email !== null)
        updateData.email = data.email;
      if (data.fullName !== undefined && data.fullName !== null)
        updateData.fullName = data.fullName;
      if (data.roleId !== undefined && data.roleId !== null)
        updateData.Role = { connect: { id: data.roleId } };
      if (data.supabaseId !== undefined && data.supabaseId !== null)
        updateData.supabaseId = data.supabaseId;
      if (data.isActive !== undefined && data.isActive !== null)
        updateData.isActive = data.isActive;
      if (data.customerType !== undefined && data.customerType !== null)
        updateData.customerType = data.customerType;
      if (data.taxCode !== undefined && data.taxCode !== null)
        updateData.taxCode = data.taxCode;
      if (data.companyName !== undefined && data.companyName !== null)
        updateData.companyName = data.companyName;
      if (data.phone !== undefined && data.phone !== null)
        updateData.phone = data.phone;
      if (data.avatarUrl !== undefined && data.avatarUrl !== null)
        updateData.avatarUrl = data.avatarUrl;
      if (data.language !== undefined && data.language !== null)
        updateData.language = data.language;
      if (data.licenseNumber !== undefined && data.licenseNumber !== null)
        updateData.licenseNumber = data.licenseNumber;
      if (data.licenseClass !== undefined && data.licenseClass !== null)
        updateData.licenseClass = data.licenseClass;
      if (data.licenseExpiry !== undefined && data.licenseExpiry !== null)
        updateData.licenseExpiry = data.licenseExpiry;
      if (data.experience !== undefined && data.experience !== null)
        updateData.experience = data.experience;
      if (data.languages !== undefined && data.languages !== null)
        updateData.languages = { set: data.languages };
      if (data.bio !== undefined && data.bio !== null)
        updateData.bio = data.bio;
      if (data.rating !== undefined && data.rating !== null)
        updateData.rating = data.rating;
      if (data.driverStatus !== undefined && data.driverStatus !== null)
        updateData.driverStatus = data.driverStatus;

      const user = await this.databaseManager.getDatabase().user.update({
        where: { id },
        data: updateData,
      });
      await this.auditLogService.log(user.id, AuditLogEvent.USER_UPDATED, {
        details: `User updated: ${user.email}`,
      });
      return user;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists.');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found.`);
        }
      }
      this.logger.error(
        `Failed to update user ${id}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not update user');
    }
  }

  async updateRole(userId: string, roleName: string): Promise<User> {
    try {
      const role = await this.databaseManager.getDatabase().role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        throw new NotFoundException(`Role with name ${roleName} not found.`);
      }

      const updatedUser = await this.databaseManager.getDatabase().user.update({
        where: { id: userId },
        data: {
          Role: { connect: { id: role.id } },
        },
      });
      await this.auditLogService.log(
        updatedUser.id,
        AuditLogEvent.USER_UPDATED,
        { details: `User ${updatedUser.email} role updated to ${roleName}` },
      );
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `User with ID ${userId} or Role with name ${roleName} not found.`,
        );
      }
      this.logger.error(
        `Failed to update role for user ${userId}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not update user role');
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const deletedUser = await this.databaseManager.getDatabase().user.delete({
        where: { id },
      });
      await this.auditLogService.log(
        deletedUser.id,
        AuditLogEvent.USER_DELETED,
        { details: `User deleted: ${deletedUser.email}` },
      );
      return deletedUser;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found.`);
        }
      }
      this.logger.error(
        `Failed to remove user ${id}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not remove user');
    }
  }

  async getUserAnalytics(input: GetUserAnalyticsInput): Promise<any> {
    try {
      const { startDate, endDate, roleId, status } = input;

      const totalUsers = await this.databaseManager.getDatabase().user.count();

      const newUsersCount = await this.databaseManager
        .getDatabase()
        .user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            roleId: roleId,
            isActive:
              status === UserStatus.ACTIVE
                ? true
                : status === UserStatus.INACTIVE
                  ? false
                  : undefined,
          },
        });

      return {
        totalUsers: totalUsers,
        newUsers: newUsersCount,
        activeUsers: 100,
        inactiveUsers: 20,
        usersByRole: [
          { role: 'ADMIN', count: 5 },
          { role: 'STAFF', count: 15 },
          { role: 'DRIVER', count: 30 },
          { role: 'CUSTOMER', count: 70 },
        ],
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get user analytics: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve user analytics');
    }
  }

  getUserServicesUsage(userId: string): Promise<any> {
    try {
      return Promise.resolve({
        totalBookings: 5,
        completedBookings: 3,
        cancelledBookings: 2,
        favoriteServices: ['Hotel', 'Flight'],
        averageRating: 4.5,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get user services usage for user ${userId}: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
        error instanceof Error ? error.stack : String(error),
        UsersService.name,
      );
      throw new BadRequestException('Could not retrieve user services usage');
    }
  }
}
