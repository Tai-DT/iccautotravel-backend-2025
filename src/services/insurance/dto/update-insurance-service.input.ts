import { InputType, PartialType, Field, ID } from '@nestjs/graphql';
import { CreateInsuranceServiceInput } from './create-insurance-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateInsuranceServiceInput extends PartialType(
  CreateInsuranceServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
