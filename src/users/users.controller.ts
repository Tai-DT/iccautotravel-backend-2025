import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Delete,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input'; // Reusing CreateUserInput for admin creation
import { UpdateUserDto } from './dto/update-user.dto'; // Will create this DTO
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UserEntity } from './entities/user.entity'; // Assuming UserEntity exists
import { UpdateUserRoleDto } from './dto/update-user-role.dto'; // Will create this DTO
import { UserFilterDto } from './dto/user-filter.dto'; // Will create this DTO
import { PaginationDto } from '../common/dto/pagination.dto'; // Will create or update this DTO
import { Role as PrismaRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to all endpoints in this controller by default
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN') // Only ADMIN can create new users (including STAFF)
  async create(@Body() createUserInput: CreateUserInput): Promise<UserEntity> {
    const user = await this.usersService.create(createUserInput);
    return UserEntity.fromPrisma(user);
  }

  @Get()
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can list users
  async findAll(
    @Query() paginationDto: PaginationDto, // Will create or update this DTO
    @Query() userFilterDto: UserFilterDto, // Will create this DTO
  ): Promise<UserEntity[]> {
    const users = await this.usersService.findAll(paginationDto, userFilterDto);
    return users.map((user) => UserEntity.fromPrisma(user));
  }

  @Get('me')
  async getProfile(@CurrentUser() user: User): Promise<UserEntity> {
    try {
      // The user object is attached to the request by JwtAuthGuard and CurrentUser decorator
      if (!user) {
        this.logger.warn('User object is null in getProfile');
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.debug(`Getting profile for user: ${user.email}`);

      // Fetch fresh user data to ensure it's up to date
      const freshUser = await this.usersService.findOne(user.id);
      if (!freshUser) {
        this.logger.warn(`User not found in database: ${user.id}`);
        throw new UnauthorizedException('User not found');
      }

      return UserEntity.fromPrisma(freshUser);
    } catch (error) {
      this.logger.error(
        `Error in getProfile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF') // Only ADMIN and STAFF can view user details by ID
  async findOne(@Param('id') id: string): Promise<UserEntity | null> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      return null;
    }
    return UserEntity.fromPrisma(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto, // Will create this DTO
  ): Promise<UserEntity> {
    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    return UserEntity.fromPrisma(updatedUser);
  }

  @Patch(':id')
  @Roles('ADMIN') // Only ADMIN can update users by ID
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return UserEntity.fromPrisma(updatedUser);
  }

  @Patch(':id/role')
  @Roles('ADMIN') // Only ADMIN can update user roles
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto, // Will create this DTO
  ): Promise<UserEntity> {
    const updatedUser = await this.usersService.updateRole(
      id,
      updateUserRoleDto.role,
    );
    return UserEntity.fromPrisma(updatedUser);
  }

  @Delete(':id')
  @Roles('ADMIN') // Only ADMIN can delete users
  async remove(@Param('id') id: string): Promise<UserEntity> {
    const removedUser = await this.usersService.remove(id);
    return UserEntity.fromPrisma(removedUser);
  }
}
