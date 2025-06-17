import { Injectable } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomI18nResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | string[] | Promise<string | string[]> {
    // Get the request object
    const req = context.switchToHttp().getRequest();

    // Check if req exists (might be GraphQL context)
    if (!req) {
      return 'en';
    }

    // Try to get language from query parameter
    if (req?.query?.lang) {
      return req.query.lang as string;
    }

    // Try to get from headers
    if (req?.headers?.['accept-language']) {
      const acceptLanguage = req.headers['accept-language'] as string;
      if (acceptLanguage.includes('vi')) {
        return 'vi';
      } else if (acceptLanguage.includes('ko')) {
        return 'ko';
      } else if (acceptLanguage.includes('en')) {
        return 'en';
      }
    }

    // Try to get from custom header
    if (req?.headers?.['x-lang']) {
      return req.headers['x-lang'] as string;
    }

    // Default to English
    return 'en';
  }
}
