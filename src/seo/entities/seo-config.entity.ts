import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SEOConfigEntity {
  @Field(() => ID)
  id!: string;

  @Field()
  page!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  keywords?: string;

  @Field({ nullable: true })
  canonicalUrl?: string;

  @Field({ nullable: true })
  ogTitle?: string;

  @Field({ nullable: true })
  ogDescription?: string;

  @Field({ nullable: true })
  ogImage?: string;

  @Field()
  ogType!: string;

  @Field({ nullable: true })
  ogUrl?: string;

  @Field()
  twitterCard!: string;

  @Field({ nullable: true })
  twitterTitle?: string;

  @Field({ nullable: true })
  twitterDescription?: string;

  @Field({ nullable: true })
  twitterImage?: string;

  @Field({ nullable: true })
  twitterSite?: string;

  @Field({ nullable: true })
  twitterCreator?: string;

  @Field()
  robots!: string;

  @Field()
  lang!: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Static method to convert Prisma model to GraphQL entity
  static fromPrisma(seoConfig: any): SEOConfigEntity {
    const entity = new SEOConfigEntity();
    Object.assign(entity, seoConfig);
    return entity;
  }
}
