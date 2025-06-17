import { I18nOptions } from 'nestjs-i18n';
import { AcceptLanguageResolver, CookieResolver, HeaderResolver, QueryResolver } from 'nestjs-i18n';
import { CustomI18nResolver } from './custom-i18n.resolver';
import * as path from 'path';

// Export resolver for use in module
export const customI18nResolver = new CustomI18nResolver();

export const i18nOptions: I18nOptions = {
  fallbackLanguage: 'en',
  loaderOptions: {
    path: path.join(__dirname),
    watch: true,
    filePattern: '*.json',
    includeSubfolders: true,
  },
  // IMPORTANT: Must explicitly provide resolvers as an array, not undefined
  resolvers: [
    {
      use: QueryResolver,
      options: ['lang'],
    },
    AcceptLanguageResolver,
    {
      use: HeaderResolver,
      options: ['x-lang'],
    },
    {
      use: CookieResolver,
      options: ['lang'],
    },
    customI18nResolver,
  ],
};
