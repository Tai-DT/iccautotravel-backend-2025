import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { BannerPosition } from '../enums/banner-position.enum';
import { BannerType } from '../enums/banner-type.enum';

@ObjectType()
export class BannerEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  linkUrl?: string;

  @Field({ nullable: true })
  buttonText?: string;

  @Field(() => BannerPosition)
  position!: BannerPosition;

  @Field(() => BannerType)
  type!: BannerType;

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => Int)
  sortOrder!: number;

  @Field()
  lang!: string;

  @Field({ nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  seoDescription?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Static method to convert Prisma model to GraphQL entity
  static fromPrisma(banner: any): BannerEntity {
    const entity = new BannerEntity();
    Object.assign(entity, banner);
    return entity;
  }
}
