import { Injectable } from '@nestjs/common';
import { TranslationService } from '../translation.service';

@Injectable()
export class MultilingualService {
  constructor(private readonly translationService: TranslationService) {}

  /**
   * Chuyển đổi dữ liệu sang định dạng đa ngôn ngữ
   * @param data Dữ liệu đầu vào
   * @param language Ngôn ngữ hiện tại
   * @returns Dữ liệu với các trường đa ngôn ngữ đã xử lý
   */
  transformToMultilingual(data: any, language = 'en'): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.transformToMultilingual(item, language));
    }

    if (typeof data === 'object' && data !== null) {
      const result = { ...data };

      // Xử lý các trường đa ngôn ngữ có định dạng *_i18n
      Object.keys(result).forEach(key => {
        if (key.endsWith('_i18n') && result[key]) {
          const baseFieldName = key.replace('_i18n', '');
          
          // Lấy giá trị phù hợp với ngôn ngữ hoặc sử dụng fallback
          if (result[key][language]) {
            result[baseFieldName] = result[key][language];
          } else if (result[key].en) {
            result[baseFieldName] = result[key].en;
          } else if (Object.keys(result[key]).length > 0) {
            const firstLang = Object.keys(result[key])[0];
            result[baseFieldName] = result[key][firstLang];
          }
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = this.transformToMultilingual(result[key], language);
        }
      });

      return result;
    }

    return data;
  }

  /**
   * Tạo đối tượng phản hồi đa ngôn ngữ chuẩn
   * @param data Dữ liệu muốn trả về
   * @param lang Ngôn ngữ yêu cầu
   * @param messageKey Khóa thông báo trong file ngôn ngữ
   * @returns Đối tượng phản hồi chuẩn với thông tin ngôn ngữ
   */
  createMultilingualResponse<T>(data: T, lang: string, messageKey?: string): any {
    const response = {
      success: true,
      data: this.transformToMultilingual(data, lang),
      language: lang,
      meta: {
        timestamp: new Date().toISOString(),
        availableLanguages: this.translationService.getSupportedLanguages?.() || ['en', 'vi', 'ko'],
        version: '1.0.0',
      }
    };

    if (messageKey) {
      response['message'] = this.translationService.translate(messageKey, { lang });
    }

    return response;
  }

  /**
   * Tạo đối tượng đa ngôn ngữ
   * @param values Object chứa các giá trị theo ngôn ngữ
   * @returns Đối tượng với cấu trúc đa ngôn ngữ
   */
  createMultilingualField(values: {
    en?: string;
    vi?: string;
    ko?: string;
    [key: string]: string;
  }): Record<string, string> {
    return {
      en: values.en || '',
      vi: values.vi || values.en || '',
      ko: values.ko || values.en || '',
      ...values
    };
  }
}
