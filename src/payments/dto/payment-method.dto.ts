import { ObjectType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class PaymentMethodDto {
  @Field()
  @ApiProperty({ description: 'Payment provider code' })
  provider!: string;

  @Field()
  @ApiProperty({ description: 'Payment method display name' })
  name!: string;

  @Field()
  @ApiProperty({ description: 'Payment method description' })
  description!: string;
}
