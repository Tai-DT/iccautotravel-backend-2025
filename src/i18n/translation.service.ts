import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MockI18nService } from './mock-i18n.service';

@Injectable()
export class TranslationService {
  private i18nImplementation: MockI18nService;

  constructor() {
    // Use our mock service instead of the nestjs-i18n service to avoid resolver issues
    this.i18nImplementation = new MockI18nService();
  }

  translate(key: string, options?: any): string {
    return this.i18nImplementation.translate(key, options);
  }

  translateWithLang(key: string, lang: string, options?: any): string {
    return this.i18nImplementation.translate(key, { lang, ...options });
  }

  // Common translation methods for better type safety
  getServiceTypeName(serviceType: string, lang?: string): string {
    return this.translate(`services.service_types.${serviceType}`, { lang });
  }

  getCommonText(key: string, lang?: string): string {
    return this.translate(`common.${key}`, { lang });
  }

  getStatusText(status: string, lang?: string): string {
    return this.translate(`services.status.${status}`, { lang });
  }

  getVehicleText(key: string, lang?: string): string {
    return this.translate(`services.vehicle.${key}`, { lang });
  }

  getHotelText(key: string, lang?: string): string {
    return this.translate(`services.hotel.${key}`, { lang });
  }

  getFlightText(key: string, lang?: string): string {
    return this.translate(`services.flight.${key}`, { lang });
  }

  // Booking-related translations
  getBookingText(key: string, lang?: string): string {
    return this.translate(`booking.booking.${key}`, { lang });
  }

  getPaymentText(key: string, lang?: string): string {
    return this.translate(`booking.payment.${key}`, { lang });
  }

  getLocationText(key: string, lang?: string): string {
    return this.translate(`booking.locations.${key}`, { lang });
  }

  // Validation messages
  getValidationMessage(key: string, lang?: string, args?: any): string {
    return this.translate(`validation.${key}`, { lang, args });
  }

  getSupportedLanguages(): string[] {
    return ['en', 'vi', 'ko'];
  }
}
