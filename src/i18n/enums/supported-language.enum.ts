import { registerEnumType } from '@nestjs/graphql';

export enum SupportedLanguage {
  EN = 'en',
  VI = 'vi',
  KO = 'ko',
}

registerEnumType(SupportedLanguage, {
  name: 'SupportedLanguage',
  description: 'Supported languages for internationalization',
  valuesMap: {
    EN: {
      description: 'English',
    },
    VI: {
      description: 'Vietnamese',
    },
    KO: {
      description: 'Korean',
    },
  },
});
