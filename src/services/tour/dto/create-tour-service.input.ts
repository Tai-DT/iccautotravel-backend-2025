import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input';
import { TourDetailsInput } from './tour-details.input';

@InputType()
export class CreateTourServiceInput extends PartialType(CreateServiceInput) {
  @Field(() => TourDetailsInput, { nullable: true })
  tourDetails?: TourDetailsInput;

  // name và type sẽ được kế thừa từ CreateServiceInput (thông qua PartialType)
  // Logic service sẽ cần đảm bảo name được cung cấp và type được gán là TOUR.
}
