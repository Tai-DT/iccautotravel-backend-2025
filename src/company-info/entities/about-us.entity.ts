import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class CompanyValue {
  @Field()
  @ApiProperty()
  title!: string;

  @Field()
  @ApiProperty()
  description!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  iconUrl?: string;
}

@ObjectType()
export class TeamMember {
  @Field()
  @ApiProperty()
  name!: string;

  @Field()
  @ApiProperty()
  position!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  bio?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  photoUrl?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  email?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  linkedIn?: string;
}

@ObjectType()
export class CompanyMilestone {
  @Field()
  @ApiProperty()
  year!: number;

  @Field()
  @ApiProperty()
  title!: string;

  @Field()
  @ApiProperty()
  description!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  imageUrl?: string;
}

@ObjectType()
export class CompanyStats {
  @Field()
  @ApiProperty()
  yearsInBusiness!: number;

  @Field()
  @ApiProperty()
  happyCustomers!: number;

  @Field()
  @ApiProperty()
  toursCompleted!: number;

  @Field()
  @ApiProperty()
  destinations!: number;

  @Field()
  @ApiProperty()
  fleetSize!: number;

  @Field()
  @ApiProperty()
  professionalDrivers!: number;
}

@ObjectType()
export class Certification {
  @Field()
  @ApiProperty()
  name!: string;

  @Field()
  @ApiProperty()
  issuedBy!: string;

  @Field()
  @ApiProperty()
  issuedDate!: Date;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  expiryDate?: Date;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  certificateImageUrl?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  verificationUrl?: string;
}

@ObjectType()
export class ContactInfo {
  @Field()
  @ApiProperty()
  address!: string;

  @Field()
  @ApiProperty()
  email!: string;

  @Field()
  @ApiProperty()
  phone!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  emergencyPhone?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  hotline?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  fax?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  poBox?: string;
}

@ObjectType()
export class WorkingHours {
  @Field({ nullable: true })
  @ApiProperty({ required: false })
  monday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  tuesday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  wednesday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  thursday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  friday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  saturday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  sunday?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  holiday?: string;
}

@ObjectType()
export class SocialMedia {
  @Field({ nullable: true })
  @ApiProperty({ required: false })
  facebook?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  instagram?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  youtube?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  linkedIn?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  tiktok?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  zalo?: string;
}

@ObjectType()
export class AboutUsEntity {
  @Field(() => ID)
  @ApiProperty()
  id!: string;

  // Basic Information
  @Field()
  @ApiProperty()
  name!: string;

  @Field()
  @ApiProperty()
  tagline!: string;

  @Field()
  @ApiProperty()
  shortDescription!: string;

  @Field()
  @ApiProperty()
  longDescription!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  logoUrl?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  coverImageUrl?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  website?: string;

  // Contact Information
  @Field(() => ContactInfo)
  @ApiProperty({ type: ContactInfo })
  contactInfo!: ContactInfo;

  // Mission & Vision
  @Field()
  @ApiProperty()
  mission!: string;

  @Field()
  @ApiProperty()
  vision!: string;

  @Field(() => [CompanyValue])
  @ApiProperty({ type: [CompanyValue] })
  values!: CompanyValue[];

  // Company History
  @Field()
  @ApiProperty()
  foundingYear!: number;

  @Field()
  @ApiProperty()
  foundingStory!: string;

  @Field(() => [CompanyMilestone])
  @ApiProperty({ type: [CompanyMilestone] })
  milestones!: CompanyMilestone[];

  // Team Information
  @Field(() => [TeamMember])
  @ApiProperty({ type: [TeamMember] })
  teamMembers!: TeamMember[];

  // Statistics
  @Field(() => CompanyStats)
  @ApiProperty({ type: CompanyStats })
  statistics!: CompanyStats;

  // Certifications
  @Field(() => [Certification])
  @ApiProperty({ type: [Certification] })
  certifications!: Certification[];

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  awards!: string[];

  // Business Information
  @Field()
  @ApiProperty()
  businessLicense!: string;

  @Field()
  @ApiProperty()
  taxId!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  tourismLicense?: string;

  // Working Hours & Social Media
  @Field(() => WorkingHours)
  @ApiProperty({ type: WorkingHours })
  workingHours!: WorkingHours;

  @Field(() => SocialMedia)
  @ApiProperty({ type: SocialMedia })
  socialMedia!: SocialMedia;

  // Localization
  @Field()
  @ApiProperty()
  language!: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  metaDescription?: string;

  @Field(() => [String], { nullable: true })
  @ApiProperty({ type: [String], required: false })
  seoKeywords?: string[];

  // Additional Features
  @Field(() => [String], { nullable: true })
  @ApiProperty({ type: [String], required: false })
  galleryImages?: string[];

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  introVideoUrl?: string;

  @Field(() => [String], { nullable: true })
  @ApiProperty({ type: [String], required: false })
  partnerLogos?: string[];

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  sustainabilityInfo?: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  safetyProtocols?: string;

  // Timestamps
  @Field()
  @ApiProperty()
  createdAt!: Date;

  @Field()
  @ApiProperty()
  updatedAt!: Date;

  @Field()
  @ApiProperty()
  isActive!: boolean;
}
