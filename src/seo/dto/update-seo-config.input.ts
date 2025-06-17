import { InputType, PartialType } from '@nestjs/graphql';
import { CreateSEOConfigInput } from './create-seo-config.input';

@InputType()
export class UpdateSEOConfigInput extends PartialType(CreateSEOConfigInput) {}
