import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateFastTrackServiceInput } from './create-fast-track-service.input';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateFastTrackServiceInput extends PartialType(
  CreateFastTrackServiceInput,
) {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}
