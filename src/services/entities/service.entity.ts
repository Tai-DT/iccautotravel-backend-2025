import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ServiceType } from '@prisma/client';
import { GraphQLJSON } from 'graphql-scalars';

registerEnumType(ServiceType, {
  name: 'ServiceType',
  description: 'The type of service (FLIGHT, VEHICLE, HOTEL, etc.)',
});

// Define an extended interface for the Service model with additional properties
export interface ServiceWithExtras {
  name: string;
  description: string | null;
  isActive: boolean;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
  type: ServiceType;
  audioFileMaleId: string | null;
  audioFileFemaleId: string | null;
  isDeleted: boolean;
  // Additional properties that might not be in the Prisma model
  price?: any; // Using 'any' to accommodate Decimal | null
  currency?: string | null;
  duration?: number | null;
  durationUnit?: string | null;
  status?: string | null;
  highlights?: string[];
  tags?: string[];
  imageUrl?: string | null;
  allowPayLater?: boolean;
}

@ObjectType()
export class ServiceEntity {
  @Field(() => ID)
  id!: string;

  @Field(() => ServiceType)
  type!: ServiceType;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  price?: number;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  duration?: number;

  @Field({ nullable: true })
  durationUnit?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => [String], { nullable: true })
  highlights?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  audioFileMaleId?: string;

  @Field({ nullable: true })
  audioFileFemaleId?: string;

  @Field(() => Boolean, { defaultValue: true })
  isActive!: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any> | null;

  @Field(() => Boolean, { defaultValue: false })
  isDeleted!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // I18N + SEO + Audio Fields - Using GraphQLJSON for now
  @Field(() => GraphQLJSON, { nullable: true })
  localizedData?: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  seoData?: Record<string, any>;

  @Field({ nullable: true })
  currentLanguage?: string;

  @Field({ nullable: true })
  seoUrl?: string;

  @Field(() => Boolean, { defaultValue: false })
  hasSEO?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  hasAudio?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  isTranslated?: boolean;

  // Computed field for localized service type name
  @Field({ nullable: true })
  localizedTypeName?: string;

  @Field(() => Boolean, { defaultValue: false })
  allowPayLater!: boolean;

  static fromPrisma(service: ServiceWithExtras): ServiceEntity {
    const entity = new ServiceEntity();
    const metadata = (service.metadata as any) || {};

    entity.id = service.id;
    entity.type = service.type;
    entity.name = service.name;
    entity.description = service.description ?? undefined;

    // Extract from metadata if not directly on service object
    entity.price =
      service.price != null
        ? Number(service.price)
        : metadata.price != null
          ? Number(metadata.price)
          : undefined;
    entity.currency = service.currency ?? metadata.currency ?? undefined;
    entity.duration = service.duration ?? metadata.duration ?? undefined;
    entity.durationUnit =
      service.durationUnit ?? metadata.durationUnit ?? undefined;
    entity.status = service.status ?? undefined;
    entity.highlights = service.highlights ?? metadata.highlights ?? [];
    entity.tags = service.tags ?? metadata.tags ?? [];
    entity.imageUrl = service.imageUrl ?? metadata.imageUrl ?? undefined;

    entity.audioFileMaleId = service.audioFileMaleId ?? undefined;
    entity.audioFileFemaleId = service.audioFileFemaleId ?? undefined;
    entity.isActive = service.isActive;
    entity.metadata = service.metadata as Record<string, any> | null;
    entity.isDeleted = service.isDeleted;
    entity.createdAt = service.createdAt;
    entity.updatedAt = service.updatedAt;
    entity.allowPayLater =
      service.allowPayLater ?? metadata.allowPayLater ?? false;

    // localizedTypeName is a computed field, not directly from Prisma
    return entity;
  }
}
