import { Injectable } from '@nestjs/common';
import { TranslationService } from '../translation.service';
import { CreateI18nBookingDto } from '../dto/create-i18n-booking.dto';

export interface BookingData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  localizedServiceType: string;
  bookingDate: string;
  destination: string;
  localizedDestination: string;
  status: string;
  localizedStatus: string;
  totalAmount?: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class I18nBookingService {
  constructor(private readonly translationService: TranslationService) {}

  createBooking(input: CreateI18nBookingDto, lang: string): BookingData {
    // In a real application, this would save to the database
    const bookingId = 'BK-' + Date.now();

    const booking: BookingData = {
      id: bookingId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      serviceType: input.serviceType,
      localizedServiceType: this.translationService.getServiceTypeName(
        input.serviceType,
        lang,
      ),
      bookingDate: input.bookingDate,
      destination: input.destination,
      localizedDestination: this.getLocalizedDestination(
        input.destination,
        lang,
      ),
      status: 'pending',
      localizedStatus: this.translationService.getStatusText('pending', lang),
      totalAmount: this.calculateAmount(input.serviceType),
      currency: this.getCurrencyByLanguage(lang),
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return booking;
  }

  getBookingById(id: string, lang: string): BookingData | null {
    // Mock data - in real app, fetch from database
    const mockBooking: BookingData = {
      id,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+84123456789',
      serviceType: 'car_rental',
      localizedServiceType: this.translationService.getServiceTypeName(
        'car_rental',
        lang,
      ),
      bookingDate: '2025-06-01',
      destination: 'hanoi',
      localizedDestination: this.getLocalizedDestination('hanoi', lang),
      status: 'confirmed',
      localizedStatus: this.translationService.getStatusText('confirmed', lang),
      totalAmount: 1500000,
      currency: this.getCurrencyByLanguage(lang),
      notes: 'Airport pickup required',
      createdAt: '2025-05-24T10:00:00Z',
      updatedAt: '2025-05-24T10:00:00Z',
    };

    return mockBooking;
  }

  updateBookingStatus(id: string, status: string, lang: string): BookingData {
    // Mock update - in real app, update database
    const booking = this.getBookingById(id, lang);
    if (!booking) {
      throw new Error(
        this.translationService.getBookingText('booking_not_found', lang),
      );
    }

    booking.status = status;
    booking.localizedStatus = this.translationService.getStatusText(
      status,
      lang,
    );
    booking.updatedAt = new Date().toISOString();

    return booking;
  }

  getBookingStatusOptions(
    lang: string,
  ): Array<{ value: string; label: string }> {
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    return statuses.map((status) => ({
      value: status,
      label: this.translationService.getStatusText(status, lang),
    }));
  }

  getServiceTypeOptions(lang: string): Array<{ value: string; label: string }> {
    const serviceTypes = [
      'car_rental',
      'hotel_booking',
      'flight_booking',
      'tour_package',
    ];
    return serviceTypes.map((type) => ({
      value: type,
      label: this.translationService.getServiceTypeName(type, lang),
    }));
  }

  getPaymentMethodOptions(
    lang: string,
  ): Array<{ value: string; label: string }> {
    const methods = ['cash', 'credit_card', 'bank_transfer', 'digital_wallet'];
    return methods.map((method) => ({
      value: method,
      label: this.translationService.getPaymentText(method, lang),
    }));
  }

  getPopularDestinations(
    lang: string,
  ): Array<{ value: string; label: string }> {
    const destinations = [
      'hanoi',
      'ho_chi_minh',
      'da_nang',
      'seoul',
      'busan',
      'jeju',
    ];
    return destinations.map((dest) => ({
      value: dest,
      label: this.translationService.getLocationText(dest, lang),
    }));
  }

  private getLocalizedDestination(destination: string, lang: string): string {
    // Try to get from location translations first
    try {
      return this.translationService.getLocationText(destination, lang);
    } catch {
      // If not found in translations, return the original destination
      return destination;
    }
  }

  private calculateAmount(serviceType: string): number {
    // Mock pricing based on service type
    const basePrices: Record<string, number> = {
      car_rental: 1500000,
      hotel_booking: 2000000,
      flight_booking: 5000000,
      tour_package: 8000000,
    };
    return basePrices[serviceType] || 1000000;
  }

  private getCurrencyByLanguage(lang: string): string {
    switch (lang) {
      case 'vi':
        return 'VND';
      case 'ko':
        return 'KRW';
      case 'en':
      default:
        return 'USD';
    }
  }

  formatAmount(amount: number, lang: string): string {
    const currency = this.getCurrencyByLanguage(lang);

    switch (lang) {
      case 'vi':
        return `${amount.toLocaleString('vi-VN')} ${currency}`;
      case 'ko':
        return `${amount.toLocaleString('ko-KR')} ${currency}`;
      case 'en':
      default:
        return `${currency} ${amount.toLocaleString('en-US')}`;
    }
  }
}
