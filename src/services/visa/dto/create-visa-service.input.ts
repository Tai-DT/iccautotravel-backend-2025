import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateServiceInput } from '../../dto/create-service.input';
import { GraphQLJSONObject } from 'graphql-type-json';
import { IsOptional, IsJSON } from 'class-validator';

@InputType()
export class CreateVisaServiceInput extends PartialType(CreateServiceInput) {
  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  @IsJSON()
  visaDetails?: object;

  // name và type sẽ được kế thừa từ CreateServiceInput (thông qua PartialType)
  // Logic service sẽ cần đảm bảo name được cung cấp và type được gán là VISA.
}
