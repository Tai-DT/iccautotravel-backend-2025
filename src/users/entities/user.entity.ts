import { Field, Float, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  DriverApprovalStatus,
  Prisma,
  User as PrismaUser,
} from '@prisma/client';

registerEnumType(DriverApprovalStatus, {
  name: 'DriverApprovalStatus',
  description: 'Driver approval status',
});

@ObjectType()
export class UserEntity {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  fullName!: string;

  @Field(() => String, { nullable: true })
  role!: string | null;

  @Field()
  password!: string;

  @Field(() => String, { nullable: true })
  phone!: string | null;

  @Field(() => String, { nullable: true })
  customerType!: string | null;

  @Field(() => String, { nullable: true })
  taxCode!: string | null;

  @Field(() => String, { nullable: true })
  companyName!: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field()
  language!: string;

  @Field(() => String, { nullable: true })
  licenseNumber!: string | null;

  @Field(() => String, { nullable: true })
  licenseClass!: string | null;

  @Field(() => Date, { nullable: true })
  licenseExpiry!: Date | null;

  @Field(() => Number, { nullable: true })
  experience!: number | null;

  @Field(() => [String])
  languages!: string[];

  @Field(() => String, { nullable: true })
  bio!: string | null;

  @Field(() => Float, { nullable: true })
  rating!: Prisma.Decimal | null;

  @Field(() => DriverApprovalStatus, { nullable: true })
  driverStatus!: DriverApprovalStatus | null;

  @Field(() => String, { nullable: true })
  supabaseId!: string | null;

  static fromPrisma(user: any): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.fullName = user.fullName || '';
    entity.role = user.role?.name || null;
    entity.password = user.password;
    entity.phone = user.phone;
    entity.customerType = user.customerType;
    entity.taxCode = user.taxCode;
    entity.companyName = user.companyName;
    entity.avatarUrl = user.avatarUrl;
    entity.isActive = user.isActive;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    entity.language = user.language || '';
    entity.licenseNumber = user.licenseNumber;
    entity.licenseClass = user.licenseClass;
    entity.licenseExpiry = user.licenseExpiry;
    entity.experience = user.experience ? Number(user.experience) : null;
    entity.languages = user.languages || [];
    entity.bio = user.bio;
    entity.rating = user.rating;
    entity.driverStatus = user.driverStatus;
    entity.supabaseId = user.supabaseId;
    return entity;
  }
}
