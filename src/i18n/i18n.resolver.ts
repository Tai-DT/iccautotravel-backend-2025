import { Resolver, Query, Args } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { TranslationService } from './translation.service';
import { SupportedLanguage } from './enums/supported-language.enum';

@ObjectType()
export class TranslationInfo {
  @Field(() => [SupportedLanguage])
  supportedLanguages!: SupportedLanguage[];

  @Field()
  defaultLanguage!: string;

  @Field()
  currentLanguage!: string;
}

@ObjectType()
export class TranslationResponse {
  @Field()
  key!: string;

  @Field()
  value!: string;

  @Field()
  language!: string;
}

@Resolver()
export class I18nResolver {
  constructor(private readonly translationService: TranslationService) {}

  @Query(() => TranslationInfo)
  translationInfo(
    @Args('lang', { type: () => String, nullable: true }) lang?: string,
  ): TranslationInfo {
    return {
      supportedLanguages: [
        SupportedLanguage.EN,
        SupportedLanguage.VI,
        SupportedLanguage.KO,
      ],
      defaultLanguage: 'en',
      currentLanguage: lang || 'en',
    };
  }

  @Query(() => TranslationResponse)
  translate(
    @Args('key', { type: () => String }) key: string,
    @Args('lang', { type: () => String, nullable: true }) lang?: string,
  ): TranslationResponse {
    const language = lang || 'en';
    const value = this.translationService.translateWithLang(key, language);

    return {
      key,
      value,
      language,
    };
  }

  @Query(() => [String])
  getSupportedLanguages(): string[] {
    return this.translationService.getSupportedLanguages();
  }
}
