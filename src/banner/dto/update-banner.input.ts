import { InputType, PartialType } from '@nestjs/graphql';
import { CreateBannerInput } from './create-banner.input';

@InputType()
export class UpdateBannerInput extends PartialType(CreateBannerInput) {}
