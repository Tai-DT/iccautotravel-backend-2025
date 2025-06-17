import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import {
  FrontendI18nService,
  BulkTranslationRequest,
} from '../services/frontend-i18n.service';
import { I18nLang } from '../decorators/i18n-lang.decorator';
import { SupportedLanguage } from '../enums/supported-language.enum';

@ObjectType()
export class MultiLanguageFieldGQL {
  @Field()
  en!: string;

  @Field()
  vi!: string;

  @Field()
  ko!: string;
}

@ObjectType()
export class TranslationMetadata {
  @Field(() => [String])
  supportedLanguages!: string[];

  @Field()
  defaultLanguage!: string;

  @Field()
  fallbackLanguage!: string;
}

@ObjectType()
export class LocalizedDataResponseGQL {
  @Field()
  language!: string;

  @Field(() => String)
  translations!: string; // JSON string

  @Field(() => TranslationMetadata)
  metadata!: TranslationMetadata;
}

@ObjectType()
export class NamespaceTranslations {
  @Field()
  namespace!: string;

  @Field(() => String)
  translations!: string; // JSON string of translations

  @Field()
  language!: string;
}

@ObjectType()
export class FrontendTranslationBundle {
  @Field()
  language!: string;

  @Field(() => String)
  common!: string; // JSON string

  @Field(() => String)
  services!: string; // JSON string

  @Field(() => String)
  booking!: string; // JSON string

  @Field(() => String)
  validation!: string; // JSON string

  @Field(() => String)
  serviceTypes!: string; // JSON string

  @Field(() => String)
  locations!: string; // JSON string
}

@ObjectType()
export class BulkTranslationResponse {
  @Field()
  language!: string;

  @Field(() => String)
  translations!: string; // JSON string

  @Field()
  requestedKeys!: number;

  @Field()
  translatedKeys!: number;
}

@InputType()
export class BulkTranslationInput {
  @Field(() => [String])
  keys!: string[];

  @Field()
  language!: string;

  @Field({ nullable: true })
  namespace?: string;
}

@Resolver()
export class FrontendI18nResolver {
  constructor(private readonly frontendI18nService: FrontendI18nService) {}

  @Query(() => NamespaceTranslations)
  getNamespaceTranslations(
    @Args('namespace') namespace: string,
    @Args('language', { type: () => SupportedLanguage, nullable: true })
    language?: SupportedLanguage,
    @I18nLang() detectedLang?: string,
  ): NamespaceTranslations {
    const targetLanguage = language || detectedLang || 'en';
    const translations = this.frontendI18nService.getNamespaceTranslations(
      namespace,
      targetLanguage,
    );

    return {
      namespace,
      language: targetLanguage,
      translations: JSON.stringify(translations),
    };
  }

  @Query(() => String)
  getAllLanguageTranslations(
    @Args('namespace', { nullable: true }) namespace?: string,
  ): string {
    const translations =
      this.frontendI18nService.getAllLanguageTranslations(namespace);
    return JSON.stringify(translations);
  }

  @Query(() => FrontendTranslationBundle)
  async getFrontendTranslationBundle(
    @Args('language', { type: () => SupportedLanguage, nullable: true })
    language?: SupportedLanguage,
    @I18nLang() detectedLang?: string,
  ): Promise<FrontendTranslationBundle> {
    const targetLanguage = language || detectedLang || 'en';
    const bundle =
      await this.frontendI18nService.getFrontendTranslationBundle(
        targetLanguage,
      );

    return {
      language: targetLanguage,
      common: JSON.stringify(bundle.common),
      services: JSON.stringify(bundle.services),
      booking: JSON.stringify(bundle.booking),
      validation: JSON.stringify(bundle.validation),
      serviceTypes: JSON.stringify(bundle.serviceTypes),
      locations: JSON.stringify(bundle.locations),
    };
  }

  @Mutation(() => BulkTranslationResponse)
  bulkTranslate(
    @Args('input') input: BulkTranslationInput,
  ): BulkTranslationResponse {
    const request: BulkTranslationRequest = {
      keys: input.keys,
      language: input.language,
      namespace: input.namespace,
    };

    const translations = this.frontendI18nService.bulkTranslate(request);

    return {
      language: input.language,
      translations: JSON.stringify(translations),
      requestedKeys: input.keys.length,
      translatedKeys: Object.keys(translations).length,
    };
  }

  @Query(() => String)
  getServiceTypeTranslations(): string {
    const translations = this.frontendI18nService.getServiceTypeTranslations();
    return JSON.stringify(translations);
  }

  @Query(() => String)
  getLocationTranslations(): string {
    const translations = this.frontendI18nService.getLocationTranslations();
    return JSON.stringify(translations);
  }

  @Query(() => [String])
  getSupportedLanguages(): string[] {
    return this.frontendI18nService.translationService.getSupportedLanguages();
  }

  @Query(() => String)
  validateLanguage(@Args('language') language: string): string {
    const isValid = this.frontendI18nService.isValidLanguage(language);
    if (isValid) {
      return language;
    }
    return this.frontendI18nService.getFallbackLanguage();
  }

  @Query(() => LocalizedDataResponseGQL)
  getLocalizedData(
    @Args('keys', { type: () => [String] }) keys: string[],
    @Args('language', { type: () => SupportedLanguage, nullable: true })
    language?: SupportedLanguage,
    @I18nLang() detectedLang?: string,
  ): LocalizedDataResponseGQL {
    const targetLanguage = language || detectedLang || 'en';
    const translations: Record<string, string> = {};

    for (const key of keys) {
      try {
        translations[key] =
          this.frontendI18nService.translationService.translateWithLang(
            key,
            targetLanguage,
          );
      } catch {
        translations[key] = key; // Fallback to key itself
      }
    }

    const response = this.frontendI18nService.formatForFrontend(
      translations,
      targetLanguage,
    );

    return {
      language: response.language,
      translations: JSON.stringify(response.translations),
      metadata: response.metadata,
    };
  }

  @Mutation(() => String)
  async cacheTranslations(
    @Args('language') language: string,
    @Args('namespace', { nullable: true }) namespace?: string,
  ): Promise<string> {
    if (!this.frontendI18nService.isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    if (namespace) {
      const translations = this.frontendI18nService.getNamespaceTranslations(
        namespace,
        language,
      );
      return JSON.stringify({
        cached: true,
        language,
        namespace,
        count: Object.keys(translations).length,
        timestamp: new Date().toISOString(),
      });
    }

    const bundle =
      await this.frontendI18nService.getFrontendTranslationBundle(language);
    const totalKeys =
      Object.keys(bundle.common).length +
      Object.keys(bundle.services).length +
      Object.keys(bundle.booking).length +
      Object.keys(bundle.validation).length;

    return JSON.stringify({
      cached: true,
      language,
      namespace: 'all',
      count: totalKeys,
      timestamp: new Date().toISOString(),
    });
  }
}
