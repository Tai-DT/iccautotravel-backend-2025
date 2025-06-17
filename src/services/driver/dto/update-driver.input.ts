import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateDriverInput } from './create-driver.input';

@InputType()
export class UpdateDriverInput extends PartialType(CreateDriverInput) {
  // All fields from CreateDriverInput are optional in UpdateDriverInput
}
