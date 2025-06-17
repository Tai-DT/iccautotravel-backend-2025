import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslationService } from '../translation.service';

/**
 * Interceptor để tự động xử lý đa ngôn ngữ trong API response
 */
@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  constructor(private readonly translationService: TranslationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Xác định ngôn ngữ từ request (query, header, cookie)
    const language = this.extractLanguageFromRequest(request);

    return next.handle().pipe(
      map(response => {
        if (!response || typeof response !== 'object') {
          return response;
        }

        // Nếu response có trường data và messages, xử lý chúng
        if (response.data) {
          response.data = this.processTranslations(response.data, language);
        }

        if (response.message && typeof response.message === 'string') {
          response.message = this.translationService.translate(response.message, { lang: language });
        }

        // Thêm thông tin ngôn ngữ vào response
        response.meta = {
          ...(response.meta || {}),
          language,
          availableLanguages: this.translationService.getSupportedLanguages?.() || ['en', 'vi', 'ko'],
        };

        return response;
      }),
    );
  }

  private extractLanguageFromRequest(request: any): string {
    // Ưu tiên theo thứ tự: query param, header, cookie
    let language = 'en'; // Default language
    
    // 1. Check query parameter
    if (request.query?.lang) {
      language = request.query.lang;
    }
    // 2. Check header
    else if (request.headers['x-language'] || request.headers['accept-language']) {
      language = request.headers['x-language'] || this.parseAcceptLanguage(request.headers['accept-language']);
    }
    // 3. Check user preference if authenticated
    else if (request.user?.preferredLanguage) {
      language = request.user.preferredLanguage;
    }

    // Kiểm tra ngôn ngữ hỗ trợ
    const supportedLanguages = this.translationService.getSupportedLanguages?.() || ['en', 'vi', 'ko'];
    if (!supportedLanguages.includes(language)) {
      language = 'en'; // Fallback to English if not supported
    }

    return language;
  }

  private parseAcceptLanguage(acceptLanguage?: string): string {
    if (!acceptLanguage) return 'en';

    // Parse the Accept-Language header and extract the preferred language
    const languages = acceptLanguage.split(',').map(lang => {
      const [language, q = 'q=1.0'] = lang.trim().split(';');
      const quality = parseFloat(q.substring(2)) || 0;
      return { language: language.substring(0, 2), quality };
    });

    // Sort by quality and return the highest quality language
    languages.sort((a, b) => b.quality - a.quality);
    
    // Map to our supported languages
    if (languages[0].language === 'vi') return 'vi';
    if (languages[0].language === 'ko') return 'ko';
    return 'en';
  }

  private processTranslations(data: any, language: string): any {
    if (Array.isArray(data)) {
      return data.map(item => this.processTranslations(item, language));
    }

    if (data !== null && typeof data === 'object') {
      const result = { ...data };

      // Process translatable fields
      Object.keys(result).forEach(key => {
        // Check for specific naming patterns that indicate a field might need translation
        if (key.endsWith('_i18n') || key.includes('localized') || key.includes('translatable')) {
          // Handle the multi-language object format
          if (result[key] && typeof result[key] === 'object' && (result[key].en || result[key].vi || result[key].ko)) {
            result[key.replace('_i18n', '')] = result[key][language] || result[key].en || Object.values(result[key])[0];
          }
        } else if (typeof result[key] === 'object') {
          // Recursively process nested objects and arrays
          result[key] = this.processTranslations(result[key], language);
        }
      });

      return result;
    }

    return data;
  }
}
