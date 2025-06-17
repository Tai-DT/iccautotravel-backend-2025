import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'User email' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @Field(() => String, { description: 'User password' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @Field(() => String, { description: 'User full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @Field(() => String, { description: 'User role ID', nullable: true })
  @IsString()
  roleId?: string;

  @Field(() => String, { nullable: true, description: 'Supabase user ID' })
  supabaseId?: string;

  @Field(() => String, { nullable: true, description: 'Customer type' })
  customerType?: string;

  @Field(() => String, { nullable: true, description: 'Tax code' })
  taxCode?: string;

  @Field(() => String, { nullable: true, description: 'Company name' })
  companyName?: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  phone?: string;

  @Field(() => String, { nullable: true, description: 'Avatar URL' })
  avatarUrl?: string;

  @Field(() => Boolean, { nullable: true, description: 'Is user active' })
  isActive?: boolean;

  @Field(() => String, { nullable: true, description: 'User language' })
  language?: string;

  @Field(() => String, { nullable: true, description: 'Driver license number' })
  licenseNumber?: string;

  @Field(() => String, { nullable: true, description: 'Driver license class' })
  licenseClass?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Driver license expiry date',
  })
  licenseExpiry?: Date;

  @Field(() => Number, {
    nullable: true,
    description: 'Driver experience in years',
  })
  experience?: number;

  @Field(() => [String], {
    nullable: true,
    description: 'Languages spoken by driver',
  })
  languages?: string[];

  @Field(() => String, { nullable: true, description: 'Driver biography' })
  bio?: string;

  @Field(() => Number, { nullable: true, description: 'Driver rating' })
  rating?: number;

  @Field(() => String, { nullable: true, description: 'Driver status' })
  driverStatus?: string;
}
