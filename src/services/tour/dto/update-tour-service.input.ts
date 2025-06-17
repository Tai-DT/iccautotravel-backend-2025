import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateTourServiceInput } from './create-tour-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateTourServiceInput extends PartialType(
  CreateTourServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
