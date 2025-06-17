import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateHotelServiceInput } from './create-hotel-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateHotelServiceInput extends PartialType(
  CreateHotelServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
