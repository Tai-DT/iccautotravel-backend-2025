import { IsBoolean, IsOptional } from 'class-validator';

import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class BookingOptionsDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  driverIncluded?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  englishSpeakingDriver?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  vietnameseSpeakingDriver?: boolean;
}
