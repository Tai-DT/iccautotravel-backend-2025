import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const I18nLang = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Try to get language from query parameter first
    if (request.query?.lang) {
      return request.query.lang;
    }

    // Try to get from custom header
    if (request.headers['x-language']) {
      return request.headers['x-language'];
    }

    // Try to get from Accept-Language header
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage && typeof acceptLanguage === 'string') {
      const languages = acceptLanguage
        .split(',')
        .map((lang: string) => {
          const parts = lang.split(';');
          return parts[0]?.trim() || '';
        })
        .filter(Boolean);
      const supportedLanguages = ['en', 'vi', 'ko'];

      for (const lang of languages) {
        if (supportedLanguages.includes(lang)) {
          return lang;
        }
        // Check for language without region (e.g., 'en' from 'en-US')
        const parts = lang.split('-');
        const langCode = parts[0];
        if (langCode && supportedLanguages.includes(langCode)) {
          return langCode;
        }
      }
    }

    // Default to English
    return 'en';
  },
);
