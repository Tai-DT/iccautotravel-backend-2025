import { InputType, Field, PartialType, OmitType } from '@nestjs/graphql';
import { CreateLocationInput } from './create-location.input';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateLocationInput extends PartialType(
  OmitType(CreateLocationInput, [] as const),
) {
  // All fields from CreateLocationInput are included as optional
  // We can add additional fields specific to updates if needed

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive phải là giá trị boolean' })
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'isPopular phải là giá trị boolean' })
  isPopular?: boolean;
}
