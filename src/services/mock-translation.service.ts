import { Injectable } from '@nestjs/common';

@Injectable()
export class MockTranslationService {
  translate(key: string, options?: any): string {
    // Simple mock implementation
    return key;
  }

  translateWithLang(key: string, lang: string, options?: any): string {
    return key;
  }

  getServiceTypeName(serviceType: string, lang?: string): string {
    const translations: { [key: string]: string } = {
      VEHICLE: 'Vehicle Service',
      HOTEL: 'Hotel Service',
      TOUR: 'Tour Service',
      FLIGHT: 'Flight Service',
      TRANSFER: 'Transfer Service',
      VISA: 'Visa Service',
      INSURANCE: 'Insurance Service',
      FAST_TRACK: 'Fast Track Service',
      BUS: 'Bus Service',
    };
    return translations[serviceType] || serviceType;
  }

  getCommonText(key: string, lang?: string): string {
    return key;
  }

  getStatusText(status: string, lang?: string): string {
    return status;
  }

  getVehicleText(key: string, lang?: string): string {
    return key;
  }

  getHotelText(key: string, lang?: string): string {
    return key;
  }

  getFlightText(key: string, lang?: string): string {
    return key;
  }

  getBookingText(key: string, lang?: string): string {
    return key;
  }

  getPaymentText(key: string, lang?: string): string {
    return key;
  }

  getLocationText(key: string, lang?: string): string {
    return key;
  }

  getValidationMessage(key: string, lang?: string, args?: any): string {
    return key;
  }

  getSupportedLanguages(): string[] {
    return ['en', 'vi', 'ko'];
  }
}
