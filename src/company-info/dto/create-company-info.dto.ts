import {
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateCompanyInfoDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  // @IsObject() // Assuming Json can be represented as an object in DTO
  // @ValidateNested()
  // @Type(() => SocialLinksDto) // You might need to define this DTO
  socialLinks?: object; // Use object for Json type

  @IsOptional()
  // @IsObject() // Assuming Json can be represented as an object in DTO
  // @ValidateNested()
  // @Type(() => WorkingHoursDto) // You might need to define this DTO
  workingHours?: object; // Use object for Json type

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(5)
  lang!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false; // Default value from schema
}
