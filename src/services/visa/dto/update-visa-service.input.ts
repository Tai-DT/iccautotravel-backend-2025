import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateVisaServiceInput } from './create-visa-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateVisaServiceInput extends PartialType(
  CreateVisaServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
