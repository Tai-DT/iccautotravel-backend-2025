import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateFlightServiceInput } from './create-flight-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateFlightServiceInput extends PartialType(
  CreateFlightServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
