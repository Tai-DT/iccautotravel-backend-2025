import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  usersCount!: number;

  @Field(() => Int)
  activeUsersCount!: number;

  @Field(() => Int)
  bookingsCount!: number;

  @Field(() => Int)
  pendingBookingsCount!: number;

  @Field(() => Int)
  totalRevenue!: number;

  @Field(() => Int)
  servicesCount!: number;

  @Field(() => Int)
  activeServicesCount!: number;

  @Field(() => Int)
  blogPostsCount!: number;
}

@ObjectType()
export class MonthlyRevenueStats {
  @Field()
  month!: string;

  @Field(() => Int)
  year!: number;

  @Field(() => Int)
  totalRevenue!: number;
}

@ObjectType()
export class DriverStats {
  @Field(() => Int)
  totalDrivers!: number;

  @Field(() => Int)
  activeDrivers!: number;

  @Field(() => Int)
  pendingDrivers!: number;
}

@ObjectType()
export class VehicleStats {
  @Field(() => Int)
  totalVehicles!: number;

  @Field(() => Int)
  activeVehicles!: number;
}

@ObjectType()
export class DailyBookingsStats {
  @Field()
  date!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class UserInfo {
  @Field()
  fullName!: string;
}

@ObjectType()
export class RecentBooking {
  @Field()
  id!: string;

  @Field()
  userId!: string;

  @Field()
  status!: string;

  @Field(() => Int)
  totalPrice!: number;

  @Field()
  paymentStatus!: string;

  @Field()
  startDate!: string;

  @Field()
  createdAt!: string;

  @Field(() => UserInfo)
  User!: UserInfo;
}

@ObjectType()
export class PopularService {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field(() => Int)
  price!: number;

  @Field(() => Int)
  bookingCount!: number;
}

@ObjectType()
export class ActivityFeed {
  @Field()
  id!: string;

  @Field()
  type!: string;

  @Field()
  action!: string;

  @Field()
  description!: string;

  @Field()
  timestamp!: string;

  @Field({ nullable: true })
  user?: string;
}
