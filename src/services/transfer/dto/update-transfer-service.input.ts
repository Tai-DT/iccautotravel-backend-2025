import { InputType, PartialType, Field, ID } from '@nestjs/graphql';
import { CreateTransferServiceInput } from './create-transfer-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateTransferServiceInput extends PartialType(
  CreateTransferServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
