import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  FrontendI18nService,
  BulkTranslationRequest,
} from '../services/frontend-i18n.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';

export class BulkTranslationDto {
  keys!: string[];
  language!: string;
  namespace?: string;
}

@ApiTags('Frontend i18n')
@Controller('api/v1/i18n')
export class FrontendI18nController {
  constructor(private readonly frontendI18nService: FrontendI18nService) {}

  @Get('languages')
  @ApiOperation({ summary: 'Get supported languages' })
  @ApiResponse({ status: 200, description: 'List of supported languages' })
  getSupportedLanguages() {
    return {
      success: true,
      data: {
        languages:
          this.frontendI18nService.translationService.getSupportedLanguages(),
        default: 'en',
        fallback: 'en',
      },
    };
  }

  @Get('namespace/:namespace')
  @ApiOperation({ summary: 'Get translations for a specific namespace' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiResponse({ status: 200, description: 'Translations for the namespace' })
  getNamespaceTranslations(
    @Param('namespace') namespace: string,
    @Query('lang') language: string = 'en',
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    // Language priority: query param > accept-language header > default
    const targetLanguage =
      language || this.extractLanguageFromHeader(acceptLanguage) || 'en';

    if (!this.frontendI18nService.isValidLanguage(targetLanguage)) {
      return {
        success: false,
        error: `Unsupported language: ${targetLanguage}`,
        fallback: this.frontendI18nService.getFallbackLanguage(),
      };
    }

    try {
      const translations = this.frontendI18nService.getNamespaceTranslations(
        namespace,
        targetLanguage,
      );

      return {
        success: true,
        data: {
          namespace,
          language: targetLanguage,
          translations,
          metadata: {
            count: Object.keys(translations).length,
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load namespace: ${namespace}`,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('bundle')
  @ApiOperation({ summary: 'Get complete translation bundle for frontend' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Browser language preference',
  })
  @ApiResponse({ status: 200, description: 'Complete translation bundle' })
  async getFrontendBundle(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const targetLanguage =
      language || this.extractLanguageFromHeader(acceptLanguage) || 'en';

    if (!this.frontendI18nService.isValidLanguage(targetLanguage)) {
      return {
        success: false,
        error: `Unsupported language: ${targetLanguage}`,
        fallback: this.frontendI18nService.getFallbackLanguage(),
      };
    }

    try {
      const bundle =
        await this.frontendI18nService.getFrontendTranslationBundle(
          targetLanguage,
        );

      return {
        success: true,
        data: {
          language: targetLanguage,
          bundle,
          metadata: {
            supportedLanguages:
              this.frontendI18nService.translationService.getSupportedLanguages(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load translation bundle',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('bulk-translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk translate multiple keys' })
  @ApiResponse({ status: 200, description: 'Bulk translation results' })
  bulkTranslate(@Body() dto: BulkTranslationDto) {
    if (!this.frontendI18nService.isValidLanguage(dto.language)) {
      return {
        success: false,
        error: `Unsupported language: ${dto.language}`,
        fallback: this.frontendI18nService.getFallbackLanguage(),
      };
    }

    try {
      const request: BulkTranslationRequest = {
        keys: dto.keys,
        language: dto.language,
        namespace: dto.namespace,
      };

      const translations = this.frontendI18nService.bulkTranslate(request);

      return {
        success: true,
        data: {
          language: dto.language,
          namespace: dto.namespace,
          translations,
          metadata: {
            requestedKeys: dto.keys.length,
            translatedKeys: Object.keys(translations).length,
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Bulk translation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('service-types')
  @ApiOperation({ summary: 'Get localized service types' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiResponse({ status: 200, description: 'Localized service types' })
  getServiceTypes(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const targetLanguage =
      language || this.extractLanguageFromHeader(acceptLanguage) || 'en';

    try {
      const serviceTypes =
        this.frontendI18nService.getServiceTypeTranslations();

      return {
        success: true,
        data: {
          language: targetLanguage,
          serviceTypes,
          metadata: {
            count: Object.keys(serviceTypes).length,
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load service types',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get localized locations' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiResponse({ status: 200, description: 'Localized locations' })
  getLocations(
    @Query('lang') language?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const targetLanguage =
      language || this.extractLanguageFromHeader(acceptLanguage) || 'en';

    try {
      const locations = this.frontendI18nService.getLocationTranslations();

      return {
        success: true,
        data: {
          language: targetLanguage,
          locations,
          metadata: {
            count: Object.keys(locations).length,
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load locations',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all translations for all languages' })
  @ApiQuery({
    name: 'namespace',
    required: false,
    description: 'Specific namespace to filter',
  })
  @ApiResponse({
    status: 200,
    description: 'All translations for all languages',
  })
  getAllTranslations(@Query('namespace') namespace?: string) {
    try {
      const allTranslations =
        this.frontendI18nService.getAllLanguageTranslations(namespace);

      return {
        success: true,
        data: {
          namespace: namespace || 'all',
          translations: allTranslations, // Đổi lại từ namespaces -> translations
          metadata: {
            languages: Object.keys(allTranslations),
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load all translations',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('validate/:language')
  @ApiOperation({ summary: 'Validate if language is supported' })
  @ApiResponse({ status: 200, description: 'Language validation result' })
  validateLanguage(@Param('language') language: string) {
    const isValid = this.frontendI18nService.isValidLanguage(language);

    return {
      success: true,
      data: {
        language,
        isValid,
        supported:
          this.frontendI18nService.translationService.getSupportedLanguages(),
        fallback: this.frontendI18nService.getFallbackLanguage(),
      },
    };
  }

  @Post('cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Prepare translations for caching' })
  async prepareCache(@Body() body: { language: string; namespace?: string }) {
    const { language, namespace } = body;

    if (!this.frontendI18nService.isValidLanguage(language)) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    try {
      let cacheData;
      let count = 0;

      if (namespace) {
        cacheData = this.frontendI18nService.getNamespaceTranslations(
          namespace,
          language,
        );
        count = Object.keys(cacheData).length;
      } else {
        cacheData =
          await this.frontendI18nService.getFrontendTranslationBundle(language);
        count =
          Object.keys(cacheData.common).length +
          Object.keys(cacheData.services).length +
          Object.keys(cacheData.booking).length +
          Object.keys(cacheData.validation).length;
      }

      return {
        success: true,
        data: {
          language,
          namespace: namespace || 'all',
          cache: cacheData,
          metadata: {
            count,
            timestamp: new Date().toISOString(),
            cacheKey: `i18n_${language}_${namespace || 'bundle'}`,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to prepare cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractLanguageFromHeader(acceptLanguage?: string): string | null {
    if (!acceptLanguage) return null;

    // Parse Accept-Language header and find supported language
    const languages = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0]?.trim().toLowerCase())
      .map((lang) => lang?.split('-')[0]) // Extract main language code
      .filter((lang): lang is string => lang !== undefined);

    const supportedLanguages =
      this.frontendI18nService.translationService.getSupportedLanguages();

    for (const lang of languages) {
      if (supportedLanguages.includes(lang)) {
        return lang;
      }
    }

    return null;
  }
}
