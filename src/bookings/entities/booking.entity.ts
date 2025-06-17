import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { GraphQLJSON } from 'graphql-scalars';
import {
  ServiceEntity,
  ServiceWithExtras,
} from '../../services/entities/service.entity';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType()
export class BookingEntity {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => UserEntity, { nullable: true })
  user?: UserEntity;

  @Field(() => [String])
  serviceIds!: string[];

  @Field(() => [ServiceEntity], { nullable: true })
  services?: ServiceEntity[];

  @Field(() => String)
  status!: BookingStatus;

  @Field(() => String)
  paymentStatus!: PaymentStatus;

  @Field(() => Float)
  totalPrice!: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String)
  bookingCode!: string;

  @Field(() => Number)
  version!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Date, { nullable: true })
  startDate?: Date | null;

  @Field(() => Date, { nullable: true })
  endDate?: Date | null;

  @Field(() => String, { nullable: true })
  vehicleId?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any> | null;

  static fromPrisma(booking: any): BookingEntity {
    const entity = new BookingEntity();
    entity.id = booking.id;
    entity.userId = booking.userId;
    entity.serviceIds = booking.BookingServices
      ? booking.BookingServices.map((bs: any) => bs.service?.id).filter(Boolean)
      : [];
    entity.status = booking.status;
    entity.paymentStatus = booking.paymentStatus;
    entity.totalPrice = booking.totalPrice.toNumber();
    entity.notes = booking.notes;
    entity.bookingCode = booking.bookingCode;
    entity.version = booking.version;
    entity.createdAt = booking.createdAt;
    entity.updatedAt = booking.updatedAt;

    // Map new fields
    entity.startDate = booking.startDate;
    entity.endDate = booking.endDate;
    entity.vehicleId = booking.vehicleId;
    entity.metadata = booking.metadata as Record<string, any> | null;

    if (booking.User) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      entity.user = UserEntity.fromPrisma(booking.User);
    }
    if (booking.BookingServices) {
      entity.services = booking.BookingServices.filter(
        (bs: any) => bs.service,
      ).map((bs: any) =>
        ServiceEntity.fromPrisma(bs.service as unknown as ServiceWithExtras),
      );
    }

    return entity;
  }
}
