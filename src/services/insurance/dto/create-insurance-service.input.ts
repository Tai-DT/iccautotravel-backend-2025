import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input'; // Assuming a generic CreateServiceInput
import { InsuranceDetailsInput } from './insurance-details.input';

@InputType()
export class CreateInsuranceServiceInput extends PartialType(
  CreateServiceInput,
) {
  @Field(() => InsuranceDetailsInput, { nullable: true })
  insuranceDetails?: InsuranceDetailsInput;
}
