import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input';
import { IsOptional } from 'class-validator';
import { ComboDetailsInput } from './combo-details.input';

@InputType()
export class CreateComboServiceInput extends PartialType(CreateServiceInput) {
  @Field(() => ComboDetailsInput, { nullable: true })
  @IsOptional()
  comboDetails?: ComboDetailsInput;

  // name và type sẽ được kế thừa từ CreateServiceInput (thông qua PartialType)
  // Logic service sẽ cần đảm bảo name được cung cấp và type được gán là COMBO.
}
