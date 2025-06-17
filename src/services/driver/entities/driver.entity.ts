import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

// Định nghĩa enum DriverStatus cho GraphQL để tương thích với ApprovalStatus của Prisma
enum DriverStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Đăng ký enum với GraphQL
registerEnumType(DriverStatus, {
  name: 'DriverStatus',
  description: 'Status of a driver approval',
});

@ObjectType('ServiceDriverEntity')
export class ServiceDriverEntity {
  @Field(() => ID)
  id: string = '';

  @Field()
  userId: string = '';

  @Field()
  licenseNumber: string = '';

  @Field()
  licenseClass: string = '';

  @Field()
  licenseExpiry: Date = new Date();

  @Field(() => Int)
  experience: number = 0;

  @Field(() => DriverStatus)
  status: DriverStatus = DriverStatus.PENDING;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [String])
  languages: string[] = [];

  @Field({ nullable: true })
  rating?: number;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  @Field()
  isActive: boolean = true;

  // Static method to convert Prisma model to entity
  static fromPrisma(data: any): ServiceDriverEntity {
    if (!data) {
      return new ServiceDriverEntity();
    }

    const entity = new ServiceDriverEntity();
    entity.id = data.id || '';
    entity.userId = data.userId || '';
    entity.licenseNumber = data.licenseNumber || '';
    entity.licenseClass = data.licenseClass || '';
    entity.licenseExpiry = data.licenseExpiry || new Date();
    entity.experience = data.experience || 0;

    // Chuyển đổi từ ApprovalStatus trong Prisma sang DriverStatus trong entity
    entity.status =
      (data.status as unknown as DriverStatus) || DriverStatus.PENDING;

    entity.bio = data.bio;
    entity.languages = Array.isArray(data.languages) ? data.languages : [];
    entity.rating = data.rating;
    entity.createdAt = data.createdAt || new Date();
    entity.updatedAt = data.updatedAt || new Date();
    entity.isActive = data.isActive !== undefined ? data.isActive : true;

    return entity;
  }
}
