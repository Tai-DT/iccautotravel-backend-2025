import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateComboServiceInput } from './create-combo-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateComboServiceInput extends PartialType(
  CreateComboServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
