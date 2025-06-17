import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO cho các trường đa ngôn ngữ
 */
export class MultiLanguageFieldDto {
  @ApiProperty({ description: 'English version' })
  en: string;

  @ApiProperty({ description: 'Vietnamese version' })
  vi: string;

  @ApiProperty({ description: 'Korean version' })
  ko: string;
}

/**
 * Base response class hỗ trợ đa ngôn ngữ
 */
export class MultilingualResponseDto<T> {
  @ApiProperty({ description: 'API response data' })
  data: T;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Language used for the response', example: 'en' })
  language: string;

  @ApiProperty({ description: 'Response message, automatically translated' })
  message?: string;

  @ApiProperty({
    description: 'Metadata about the response'
  })
  meta?: {
    timestamp: string;
    availableLanguages: string[];
    version: string;
    [key: string]: any;
  };
}

/**
 * DTO for multilingual entity responses
 */
export class MultilingualEntityDto {
  @ApiProperty({ description: 'Entity ID' })
  id: string;

  @ApiProperty({ description: 'Name of the entity in the current language' })
  name: string;

  @ApiProperty({ 
    description: 'Multilingual name data', 
    type: MultiLanguageFieldDto,
    required: false 
  })
  name_i18n?: MultiLanguageFieldDto;

  @ApiProperty({ 
    description: 'Description in the current language',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Multilingual description data', 
    type: MultiLanguageFieldDto,
    required: false 
  })
  description_i18n?: MultiLanguageFieldDto;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: string;
}
