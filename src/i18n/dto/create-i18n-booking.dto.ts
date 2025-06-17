import {
  IsNotEmpty,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class CreateI18nBookingDto {
  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsString({ message: i18nValidationMessage('validation.must_be_string') })
  @MinLength(2, {
    message: i18nValidationMessage('validation.min_length', { min: 2 }),
  })
  @MaxLength(50, {
    message: i18nValidationMessage('validation.max_length', { max: 50 }),
  })
  customerName!: string;

  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsEmail({}, { message: i18nValidationMessage('validation.invalid_email') })
  customerEmail!: string;

  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsString({ message: i18nValidationMessage('validation.must_be_string') })
  @MinLength(10, {
    message: i18nValidationMessage('validation.min_length', { min: 10 }),
  })
  @MaxLength(15, {
    message: i18nValidationMessage('validation.max_length', { max: 15 }),
  })
  customerPhone!: string;

  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsString({ message: i18nValidationMessage('validation.must_be_string') })
  serviceType!: string;

  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.invalid_date') },
  )
  bookingDate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.must_be_string') })
  @MaxLength(500, {
    message: i18nValidationMessage('validation.max_length', { max: 500 }),
  })
  notes?: string;

  @Field()
  @IsNotEmpty({ message: i18nValidationMessage('validation.required') })
  @IsString({ message: i18nValidationMessage('validation.must_be_string') })
  destination!: string;
}
