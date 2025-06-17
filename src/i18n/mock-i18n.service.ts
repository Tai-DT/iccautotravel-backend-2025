import { Injectable } from '@nestjs/common';

/**
 * This is a mock I18nService to bypass nestjs-i18n issues
 */
@Injectable()
export class MockI18nService {
  private translations = {
    en: {
      common: {
        hello: 'Hello',
        success: 'Success',
        error: 'Error',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter'
      },
      services: {
        service_types: {
          car_rental: 'Car Rental',
          hotel_booking: 'Hotel Booking',
          flight_booking: 'Flight Booking',
          tour_package: 'Tour Package',
          transfer: 'Airport Transfer',
          visa: 'Visa Service',
          bus: 'Bus Ticket',
          combo: 'Combo Package'
        },
        status: {
          available: 'Available',
          booked: 'Booked',
          completed: 'Completed',
          cancelled: 'Cancelled',
          pending: 'Pending',
          confirmed: 'Confirmed'
        },
        vehicle: {
          sedan: 'Sedan',
          suv: 'SUV',
          van: 'Van',
          minibus: 'Mini Bus',
          bus: 'Bus'
        }
      }
    },
    vi: {
      common: {
        hello: 'Xin chào',
        success: 'Thành công',
        error: 'Lỗi',
        loading: 'Đang tải...',
        save: 'Lưu',
        cancel: 'Hủy',
        delete: 'Xóa',
        edit: 'Chỉnh sửa',
        create: 'Tạo mới',
        search: 'Tìm kiếm',
        filter: 'Lọc'
      },
      services: {
        service_types: {
          car_rental: 'Thuê xe',
          hotel_booking: 'Đặt khách sạn',
          flight_booking: 'Đặt vé máy bay',
          tour_package: 'Gói tour',
          transfer: 'Đưa đón sân bay',
          visa: 'Dịch vụ Visa',
          bus: 'Vé xe buýt',
          combo: 'Gói Combo'
        }
      }
    },
    ko: {
      common: {
        hello: '안녕하세요',
        success: '성공',
        error: '오류',
        loading: '로드 중...',
        save: '저장',
        cancel: '취소',
        delete: '삭제',
        edit: '편집',
        create: '만들기',
        search: '검색',
        filter: '필터'
      },
      services: {
        service_types: {
          car_rental: '렌터카',
          hotel_booking: '호텔 예약',
          flight_booking: '항공권 예약',
          tour_package: '투어 패키지',
          transfer: '공항 환승',
          visa: '비자 서비스',
          bus: '버스 티켓',
          combo: '콤보 패키지'
        }
      }
    }
  };

  translate(key: string, options?: any): string {
    const lang = options?.lang || 'en';
    const parts = key.split('.');
    let result = this.translations[lang];

    for (const part of parts) {
      if (result && result[part]) {
        result = result[part];
      } else {
        return key; // Return the key if translation not found
      }
    }

    return typeof result === 'string' ? result : key;
  }

  getSupportedLanguages(): string[] {
    return ['en', 'vi', 'ko'];
  }

  getDefaultLanguage(): string {
    return 'en';
  }
}
