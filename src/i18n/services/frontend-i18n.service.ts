import { Injectable } from '@nestjs/common';
import { TranslationService } from '../translation.service';

export interface MultiLanguageField {
  en: string;
  vi: string;
  ko: string;
}

export interface LocalizedDataResponse {
  language: string;
  translations: Record<string, any>;
  metadata: {
    supportedLanguages: string[];
    defaultLanguage: string;
    fallbackLanguage: string;
  };
}

export interface BulkTranslationRequest {
  keys: string[];
  language: string;
  namespace?: string;
}

@Injectable()
export class FrontendI18nService {
  constructor(public readonly translationService: TranslationService) {}

  /**
   * Lấy tất cả translations cho một namespace cụ thể
   */
  getNamespaceTranslations(
    namespace: string,
    language: string,
  ): Record<string, string> {
    const translations: Record<string, string> = {};

    // Define key patterns for each namespace
    const namespaceKeys: Record<string, string[]> = {
      common: [
        'hello',
        'welcome',
        'success',
        'error',
        'warning',
        'info',
        'loading',
        'save',
        'cancel',
        'delete',
        'edit',
        'create',
        'update',
        'view',
        'search',
        'filter',
        'sort',
        'page',
        'of',
        'total',
        'items',
        'no_data',
        'confirm',
        'yes',
        'no',
      ],
      services: [
        'service_types.FLIGHT',
        'service_types.HOTEL',
        'service_types.VEHICLE',
        'service_types.TOUR',
        'service_types.VISA',
        'service_types.INSURANCE',
        'status.pending',
        'status.confirmed',
        'status.cancelled',
      ],
      booking: [
        'booking.title',
        'booking.customer_name',
        'booking.customer_email',
        'booking.booking_date',
        'booking.destination',
        'booking.booking_status',
        'payment.cash',
        'payment.credit_card',
        'payment.bank_transfer',
        'payment.completed',
        'payment.pending',
        'payment.failed',
        'locations.vietnam',
        'locations.hanoi',
        'locations.ho_chi_minh',
      ],
      validation: [
        'required',
        'invalid_email',
        'min_length',
        'max_length',
        'must_be_string',
        'invalid_date',
      ],
    };

    const keys = namespaceKeys[namespace] || [];

    for (const key of keys) {
      const fullKey = `${namespace}.${key}`;
      try {
        translations[key] = this.translationService.translateWithLang(
          fullKey,
          language,
        );
      } catch {
        // Fallback to English if translation not found
        translations[key] = this.translationService.translateWithLang(
          fullKey,
          'en',
        );
      }
    }

    return translations;
  }

  /**
   * Lấy tất cả translations cho tất cả ngôn ngữ
   */
  getAllLanguageTranslations(
    namespace?: string,
  ): Record<string, Record<string, string>> {
    const languages = this.translationService.getSupportedLanguages();
    const result: Record<string, Record<string, string>> = {};

    if (namespace) {
      for (const lang of languages) {
        result[lang] = this.getNamespaceTranslations(namespace, lang);
      }
    } else {
      // Get all namespaces for each language
      const namespaces = ['common', 'services', 'booking', 'validation'];
      for (const lang of languages) {
        result[lang] = {};
        for (const ns of namespaces) {
          const nsTranslations = this.getNamespaceTranslations(ns, lang);
          Object.keys(nsTranslations).forEach((key) => {
            const translation = nsTranslations[key];
            if (translation !== undefined) {
              result[lang]![`${ns}.${key}`] = translation;
            }
          });
        }
      }
    }

    return result;
  }

  /**
   * Bulk translation cho nhiều keys cùng lúc
   */
  bulkTranslate(request: BulkTranslationRequest): Record<string, string> {
    const { keys, language, namespace } = request;
    const translations: Record<string, string> = {};

    for (const key of keys) {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      try {
        translations[key] = this.translationService.translateWithLang(
          fullKey,
          language,
        );
      } catch {
        translations[key] = key; // Fallback to key itself
      }
    }

    return translations;
  }

  /**
   * Tạo multi-language object cho một key
   */
  createMultiLanguageField(
    key: string,
    namespace?: string,
  ): MultiLanguageField {
    const fullKey = namespace ? `${namespace}.${key}` : key;

    return {
      en: this.translationService.translateWithLang(fullKey, 'en'),
      vi: this.translationService.translateWithLang(fullKey, 'vi'),
      ko: this.translationService.translateWithLang(fullKey, 'ko'),
    };
  }

  /**
   * Format dữ liệu cho frontend với metadata
   */
  formatForFrontend(
    translations: Record<string, any>,
    language: string,
  ): LocalizedDataResponse {
    return {
      language,
      translations,
      metadata: {
        supportedLanguages: this.translationService.getSupportedLanguages(),
        defaultLanguage: 'en',
        fallbackLanguage: 'en',
      },
    };
  }

  /**
   * Lấy translations cho các service types
   */
  getServiceTypeTranslations(): Record<string, MultiLanguageField> {
    const serviceTypes = [
      'FLIGHT',
      'HOTEL',
      'VEHICLE',
      'TOUR',
      'VISA',
      'INSURANCE',
      'FAST_TRACK',
      'TRANSFER',
      'COMBO',
    ];
    const result: Record<string, MultiLanguageField> = {};

    for (const type of serviceTypes) {
      result[type] = this.createMultiLanguageField(
        `service_types.${type}`,
        'services',
      );
    }

    return result;
  }

  /**
   * Lấy translations cho locations
   */
  getLocationTranslations(): Record<string, MultiLanguageField> {
    const locations = [
      'vietnam',
      'hanoi',
      'ho_chi_minh',
      'da_nang',
      'hoi_an',
      'sapa',
      'halong_bay',
      'phu_quoc',
      'nha_trang',
      'dalat',
      'korea',
      'seoul',
      'busan',
      'jeju',
      'incheon',
    ];
    const result: Record<string, MultiLanguageField> = {};

    for (const location of locations) {
      result[location] = this.createMultiLanguageField(
        location,
        'booking.locations',
      );
    }

    return result;
  }

  /**
   * Lấy translation cache cho frontend
   */
  async getFrontendTranslationBundle(language: string): Promise<{
    common: Record<string, string>;
    services: Record<string, string>;
    booking: Record<string, string>;
    validation: Record<string, string>;
    serviceTypes: Record<string, MultiLanguageField>;
    locations: Record<string, MultiLanguageField>;
  }> {
    const [common, services, booking, validation, serviceTypes, locations] =
      await Promise.all([
        this.getNamespaceTranslations('common', language),
        this.getNamespaceTranslations('services', language),
        this.getNamespaceTranslations('booking', language),
        this.getNamespaceTranslations('validation', language),
        this.getServiceTypeTranslations(),
        this.getLocationTranslations(),
      ]);

    return {
      common,
      services,
      booking,
      validation,
      serviceTypes,
      locations,
    };
  }

  /**
   * Tạo response data đa ngôn ngữ cho entities
   */
  localizeEntity<T extends Record<string, any>>(
    entity: T,
    fieldsToLocalize: string[],
    language: string,
  ): T & Record<string, string> {
    const localized: any = { ...entity };

    for (const field of fieldsToLocalize) {
      if (entity[field]) {
        const localizedKey = `${field}_localized`;
        try {
          localized[localizedKey] = this.translationService.translateWithLang(
            String(entity[field]),
            language,
          );
        } catch {
          localized[localizedKey] = entity[field]; // Fallback to original value
        }
      }
    }

    return localized as T & Record<string, string>;
  }

  /**
   * Validate supported language
   */
  isValidLanguage(language: string): boolean {
    return this.translationService.getSupportedLanguages().includes(language);
  }

  /**
   * Get fallback language
   */
  getFallbackLanguage(): string {
    return 'en';
  }
}
