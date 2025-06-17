import { PartialType } from '@nestjs/mapped-types';
import { CreateSEOConfigDto } from './create-seo-config.dto';

export class UpdateSEOConfigDto extends PartialType(CreateSEOConfigDto) {}
