import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithLang extends Request {
  language?: string;
  user?: {
    id?: string;
    preferredLanguage?: string;
    [key: string]: any;
  };
}

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: RequestWithLang, res: Response, next: NextFunction) {
    // Language priority order:
    // 1. Query parameter (?lang=en)
    // 2. Header (x-language)
    // 3. User preference from JWT/auth
    // 4. Accept-Language header
    // 5. Default to 'en'

    let language = 'en';

    // Check query parameter
    if (req.query.lang && typeof req.query.lang === 'string') {
      language = req.query.lang;
    }
    // Check custom header
    else if (
      req.headers['x-language'] &&
      typeof req.headers['x-language'] === 'string'
    ) {
      language = req.headers['x-language'];
    }
    // Check user preference (if authenticated)
    else if (req.user?.preferredLanguage) {
      language = req.user.preferredLanguage;
    }
    // Check Accept-Language header
    else if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      if (acceptLanguage.includes('vi')) {
        language = 'vi';
      } else if (acceptLanguage.includes('ko')) {
        language = 'ko';
      } else if (acceptLanguage.includes('en')) {
        language = 'en';
      }
    }

    // Validate supported languages
    const supportedLanguages = ['en', 'vi', 'ko'];
    if (!supportedLanguages.includes(language)) {
      language = 'en';
    }

    // Set the language in the request object
    req.language = language;

    // Also set it as a header for nestjs-i18n to pick up
    req.headers['x-custom-lang'] = language;

    next();
  }
}
