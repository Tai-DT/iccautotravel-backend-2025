import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input';
import { TransferDetailsInput } from './transfer-details.input';

@InputType()
export class CreateTransferServiceInput extends PartialType(
  CreateServiceInput,
) {
  @Field(() => TransferDetailsInput, { nullable: true })
  transferDetails?: TransferDetailsInput;
}
