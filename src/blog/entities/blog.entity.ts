import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BlogStatus } from '@prisma/client';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType('Blog')
export class BlogEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field({ nullable: true })
  excerpt?: string | null;

  @Field()
  slug!: string;

  @Field()
  authorId!: string;

  @Field(() => UserEntity, { nullable: true })
  author?: UserEntity;

  @Field({ nullable: true })
  categoryId?: string | null;

  @Field()
  lang!: string;

  @Field(() => BlogStatus)
  status!: BlogStatus;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  audioFileMaleId?: string | null;

  @Field({ nullable: true })
  audioFileFemaleId?: string | null;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  seoTitle?: string | null;

  @Field({ nullable: true })
  seoDescription?: string | null;

  @Field({ nullable: true })
  featuredImageId?: string | null;

  @Field({ nullable: true })
  publishedAt?: Date | null;

  // Static method to convert Prisma model to entity
  static fromPrisma(blog: any): BlogEntity {
    const entity = new BlogEntity();
    Object.assign(entity, blog);
    return entity;
  }
}
