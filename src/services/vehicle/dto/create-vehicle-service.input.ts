import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input';
import { IsOptional } from 'class-validator';
import { VehicleDetailsInput } from './vehicle-details.input';

@InputType()
export class CreateVehicleServiceInput extends PartialType(CreateServiceInput) {
  @Field(() => VehicleDetailsInput, { nullable: true })
  @IsOptional()
  vehicleDetails?: VehicleDetailsInput;

  // name và type sẽ được kế thừa từ CreateServiceInput (thông qua PartialType)
  // Logic service sẽ cần đảm bảo name được cung cấp và type được gán là VEHICLE.
}
