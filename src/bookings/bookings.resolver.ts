import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './entities/booking.entity';
import { BookingPaginationResponse } from './entities/booking-pagination-response.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookingStatus } from '@prisma/client';
import { ROLE_NAMES } from '../common/constants/roles';

@Resolver(() => BookingEntity)
export class BookingsResolver {
  constructor(private readonly bookingsService: BookingsService) {}

  @Query(() => BookingPaginationResponse, { name: 'bookingsPaginated' })
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async findAll(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true, type: () => BookingFilterDto })
    filterDto?: BookingFilterDto,
  ): Promise<BookingPaginationResponse> {
    const result = await this.bookingsService.findAllWithPagination(
      paginationDto,
      filterDto || {},
    );
    return {
      data: result.data.map((booking) => BookingEntity.fromPrisma(booking)),
      metadata: {
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit,
      },
    };
  }

  @Query(() => BookingEntity, { name: 'booking' })
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF, ROLE_NAMES.CUSTOMER)
  async findOne(@Args('id') id: string): Promise<BookingEntity> {
    return this.bookingsService.findOne(id);
  }

  @Mutation(() => BookingEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async createBooking(
    @Args('input', { type: () => CreateBookingDto }) input: CreateBookingDto,
  ): Promise<BookingEntity> {
    return this.bookingsService.create(input);
  }

  @Mutation(() => BookingEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async updateBookingStatus(
    @Args('id') id: string,
    @Args('status', { type: () => BookingStatus }) status: BookingStatus,
  ) {
    const updatedBooking = await this.bookingsService.updateStatus(id, status);
    return BookingEntity.fromPrisma(updatedBooking);
  }

  @Mutation(() => BookingEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN)
  async removeBooking(@Args('id') id: string): Promise<BookingEntity> {
    const user = { id: 'admin-1', role: 'ADMIN' }; // Get from context
    return this.bookingsService.remove(id, user);
  }
}
