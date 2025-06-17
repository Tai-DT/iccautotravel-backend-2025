import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { TranslationService } from '../translation.service';

@Catch()
export class I18nExceptionFilter implements GqlExceptionFilter {
  constructor(
    private readonly translationService: TranslationService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    const request = context.req;

    // Extract language from request
    let lang = 'en';
    if (request.query?.lang) {
      lang = request.query.lang;
    } else if (request.headers['x-language']) {
      lang = request.headers['x-language'];
    } else if (request.headers['accept-language']) {
      const acceptLanguage = request.headers['accept-language'];
      if (typeof acceptLanguage === 'string') {
        const languages = acceptLanguage
          .split(',')
          .map((l: string) => {
            const parts = l.split(';');
            return parts[0]?.trim() || '';
          })
          .filter(Boolean);
        const supportedLanguages = ['en', 'vi', 'ko'];
        const foundLang = languages.find((l: string) =>
          supportedLanguages.includes(l),
        );
        if (foundLang) {
          lang = foundLang;
        }
      }
    }

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const errorResponse = response as any;

        // Handle validation errors
        if (errorResponse.message && Array.isArray(errorResponse.message)) {
          message = errorResponse.message
            .map((msg: string) => {
              // Try to translate common validation messages
              return this.translateValidationMessage(msg, lang);
            })
            .join(', ');
        } else if (errorResponse.message) {
          message = this.translateErrorMessage(
            String(errorResponse.message),
            lang,
          );
        }
      }
    } else {
      message = this.translationService.translateWithLang(
        'errors.internal_server_error',
        lang,
      );
    }

    return new Error(message);
  }

  private translateErrorMessage(message: string, lang: string): string {
    // Map common error messages to translation keys
    const errorMap: Record<string, string> = {
      Unauthorized: 'errors.unauthorized',
      Forbidden: 'errors.forbidden',
      'Not Found': 'errors.not_found',
      'Bad Request': 'errors.bad_request',
      'Validation failed': 'errors.validation_failed',
    };

    const translationKey = errorMap[message];
    if (translationKey) {
      return this.translationService.translateWithLang(translationKey, lang);
    }

    return message;
  }

  private translateValidationMessage(message: string, lang: string): string {
    // Map validation messages to translation keys
    if (message.includes('email')) {
      return this.translationService.translateWithLang(
        'validation.isEmail',
        lang,
      );
    }
    if (message.includes('empty')) {
      return this.translationService.translateWithLang(
        'validation.isNotEmpty',
        lang,
      );
    }
    if (message.includes('must be longer than')) {
      const match = message.match(/(\d+)/);
      const min = match ? match[1] : '0';
      return this.translationService.translateWithLang(
        'validation.minLength',
        lang,
        { min },
      );
    }
    if (message.includes('must be shorter than')) {
      const match = message.match(/(\d+)/);
      const max = match ? match[1] : '0';
      return this.translationService.translateWithLang(
        'validation.maxLength',
        lang,
        { max },
      );
    }

    return message;
  }
}
