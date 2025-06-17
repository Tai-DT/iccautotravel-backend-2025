import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateVehicleServiceInput } from './create-vehicle-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateVehicleServiceInput extends PartialType(
  CreateVehicleServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
