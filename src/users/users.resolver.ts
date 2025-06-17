import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';
import { UserEntity } from './entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserPaginationResponse } from './entities/user-pagination-response.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  updateUser(@Args('id') id: string, @Args('input') input: UpdateUserDto) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUserRole(
    @Args('id') id: string,
    @Args('input', { type: () => UpdateUserRoleDto }) input: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, input.role);
  }

  @Mutation(() => UserEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }

  @Query(() => UserPaginationResponse, { name: 'users' })
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async findAll(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true }) filterDto?: UserFilterDto,
  ): Promise<UserPaginationResponse> {
    const { data, total } = await this.usersService.findAllWithPagination(
      paginationDto,
      filterDto || {},
    );
    return {
      data: data.map((user) => UserEntity.fromPrisma(user)),
      metadata: {
        total,
        page: paginationDto.page || 1,
        limit: paginationDto.limit || 10,
      },
    };
  }

  @Query(() => UserEntity, { name: 'user', nullable: true })
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  findOne(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => UserEntity, { name: 'me', nullable: true })
  @UseGuards(GraphQLJwtAuthGuard)
  async me(@Context() context: { req: { user: { id: string } } }) {
    const userId = context.req.user.id;
    return this.usersService.findOne(userId);
  }
}
