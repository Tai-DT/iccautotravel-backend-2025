import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  IsEmail,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// About Us sections enum
export enum AboutSection {
  COMPANY_OVERVIEW = 'COMPANY_OVERVIEW',
  MISSION_VISION = 'MISSION_VISION',
  OUR_TEAM = 'OUR_TEAM',
  COMPANY_HISTORY = 'COMPANY_HISTORY',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  CERTIFICATIONS = 'CERTIFICATIONS',
  SOCIAL_RESPONSIBILITY = 'SOCIAL_RESPONSIBILITY',
}

// Company values/principles
export class CompanyValueDto {
  @ApiProperty({ description: 'Value title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Value description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Value icon URL', required: false })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}

// Team member information
export class TeamMemberDto {
  @ApiProperty({ description: 'Member name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Member position' })
  @IsString()
  position!: string;

  @ApiProperty({ description: 'Member biography', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Member photo URL', required: false })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiProperty({ description: 'Member email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'LinkedIn profile', required: false })
  @IsOptional()
  @IsUrl()
  linkedIn?: string;
}

// Company milestone/achievement
export class CompanyMilestoneDto {
  @ApiProperty({ description: 'Milestone year' })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  year!: number;

  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Milestone description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Achievement image URL', required: false })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

// Company statistics
export class CompanyStatsDto {
  @ApiProperty({ description: 'Years in business' })
  @IsNumber()
  @Min(0)
  yearsInBusiness!: number;

  @ApiProperty({ description: 'Happy customers count' })
  @IsNumber()
  @Min(0)
  happyCustomers!: number;

  @ApiProperty({ description: 'Tours completed' })
  @IsNumber()
  @Min(0)
  toursCompleted!: number;

  @ApiProperty({ description: 'Destinations covered' })
  @IsNumber()
  @Min(0)
  destinations!: number;

  @ApiProperty({ description: 'Fleet size' })
  @IsNumber()
  @Min(0)
  fleetSize!: number;

  @ApiProperty({ description: 'Professional drivers' })
  @IsNumber()
  @Min(0)
  professionalDrivers!: number;
}

// Certification information
export class CertificationDto {
  @ApiProperty({ description: 'Certification name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Issuing authority' })
  @IsString()
  issuedBy!: string;

  @ApiProperty({ description: 'Issue date' })
  issuedDate!: Date;

  @ApiProperty({ description: 'Expiry date', required: false })
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({ description: 'Certificate image URL', required: false })
  @IsOptional()
  @IsUrl()
  certificateImageUrl?: string;

  @ApiProperty({ description: 'Verification URL', required: false })
  @IsOptional()
  @IsUrl()
  verificationUrl?: string;
}

// Social media links
export class SocialMediaDto {
  @ApiProperty({ description: 'Facebook page URL', required: false })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiProperty({ description: 'Instagram profile URL', required: false })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiProperty({ description: 'YouTube channel URL', required: false })
  @IsOptional()
  @IsUrl()
  youtube?: string;

  @ApiProperty({ description: 'LinkedIn company page URL', required: false })
  @IsOptional()
  @IsUrl()
  linkedIn?: string;

  @ApiProperty({ description: 'TikTok profile URL', required: false })
  @IsOptional()
  @IsUrl()
  tiktok?: string;

  @ApiProperty({ description: 'Zalo official account', required: false })
  @IsOptional()
  @IsString()
  zalo?: string;
}

// Working hours for different days
export class WorkingHoursDto {
  @ApiProperty({ description: 'Monday hours', example: '08:00-18:00' })
  @IsOptional()
  @IsString()
  monday?: string;

  @ApiProperty({ description: 'Tuesday hours', example: '08:00-18:00' })
  @IsOptional()
  @IsString()
  tuesday?: string;

  @ApiProperty({ description: 'Wednesday hours', example: '08:00-18:00' })
  @IsOptional()
  @IsString()
  wednesday?: string;

  @ApiProperty({ description: 'Thursday hours', example: '08:00-18:00' })
  @IsOptional()
  @IsString()
  thursday?: string;

  @ApiProperty({ description: 'Friday hours', example: '08:00-18:00' })
  @IsOptional()
  @IsString()
  friday?: string;

  @ApiProperty({ description: 'Saturday hours', example: '08:00-16:00' })
  @IsOptional()
  @IsString()
  saturday?: string;

  @ApiProperty({ description: 'Sunday hours', example: 'Closed' })
  @IsOptional()
  @IsString()
  sunday?: string;

  @ApiProperty({ description: 'Holiday hours', example: 'Emergency only' })
  @IsOptional()
  @IsString()
  holiday?: string;
}

// Contact information
export class ContactInfoDto {
  @ApiProperty({ description: 'Main office address' })
  @IsString()
  address!: string;

  @ApiProperty({ description: 'Company email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Main phone number' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Emergency contact number', required: false })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiProperty({ description: 'Customer service hotline', required: false })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiProperty({ description: 'Fax number', required: false })
  @IsOptional()
  @IsString()
  fax?: string;

  @ApiProperty({ description: 'PO Box', required: false })
  @IsOptional()
  @IsString()
  poBox?: string;
}

// Enhanced Company Info DTO
export class EnhancedCompanyInfoDto {
  // Basic Information
  @ApiProperty({ description: 'Company name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Company tagline/slogan' })
  @IsString()
  tagline!: string;

  @ApiProperty({ description: 'Short company description' })
  @IsString()
  shortDescription!: string;

  @ApiProperty({ description: 'Detailed company description' })
  @IsString()
  longDescription!: string;

  @ApiProperty({ description: 'Company logo URL', required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ description: 'Company cover image URL', required: false })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiProperty({ description: 'Company website URL', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  // Contact Information
  @ApiProperty({ description: 'Contact information', type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo!: ContactInfoDto;

  // Mission & Vision
  @ApiProperty({ description: 'Company mission statement' })
  @IsString()
  mission!: string;

  @ApiProperty({ description: 'Company vision statement' })
  @IsString()
  vision!: string;

  @ApiProperty({ description: 'Company core values', type: [CompanyValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyValueDto)
  values!: CompanyValueDto[];

  // Company History & Achievements
  @ApiProperty({ description: 'Company founding year' })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  foundingYear!: number;

  @ApiProperty({ description: 'Company founding story' })
  @IsString()
  foundingStory!: string;

  @ApiProperty({
    description: 'Company milestones',
    type: [CompanyMilestoneDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyMilestoneDto)
  milestones!: CompanyMilestoneDto[];

  // Team Information
  @ApiProperty({ description: 'Team members', type: [TeamMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers!: TeamMemberDto[];

  // Company Statistics
  @ApiProperty({ description: 'Company statistics', type: CompanyStatsDto })
  @ValidateNested()
  @Type(() => CompanyStatsDto)
  statistics!: CompanyStatsDto;

  // Certifications & Awards
  @ApiProperty({
    description: 'Company certifications',
    type: [CertificationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications!: CertificationDto[];

  @ApiProperty({ description: 'Awards received', type: [String] })
  @IsArray()
  @IsString({ each: true })
  awards!: string[];

  // Business Information
  @ApiProperty({ description: 'Business license number' })
  @IsString()
  businessLicense!: string;

  @ApiProperty({ description: 'Tax identification number' })
  @IsString()
  taxId!: string;

  @ApiProperty({ description: 'Tourism license number', required: false })
  @IsOptional()
  @IsString()
  tourismLicense?: string;

  // Working Hours & Social Media
  @ApiProperty({ description: 'Working hours', type: WorkingHoursDto })
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours!: WorkingHoursDto;

  @ApiProperty({ description: 'Social media links', type: SocialMediaDto })
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia!: SocialMediaDto;

  // SEO & Localization
  @ApiProperty({ description: 'Language code', example: 'vi' })
  @IsString()
  @IsEnum(['vi', 'en', 'ko'])
  language!: string;

  @ApiProperty({ description: 'SEO meta description', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ description: 'SEO keywords', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  // Additional Features
  @ApiProperty({ description: 'Company gallery images URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  galleryImages?: string[];

  @ApiProperty({
    description: 'Company video URL (introduction)',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  introVideoUrl?: string;

  @ApiProperty({ description: 'Company testimonials', required: false })
  @IsOptional()
  @IsArray()
  testimonials?: object[];

  @ApiProperty({ description: 'Partnership logos', required: false })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  partnerLogos?: string[];

  @ApiProperty({
    description: 'Company sustainability initiatives',
    required: false,
  })
  @IsOptional()
  @IsString()
  sustainabilityInfo?: string;

  @ApiProperty({
    description: 'Safety measures and protocols',
    required: false,
  })
  @IsOptional()
  @IsString()
  safetyProtocols?: string;
}
