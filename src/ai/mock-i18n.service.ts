import { Injectable } from '@nestjs/common';

interface TranslationOptions {
  lang?: string;
  args?: any;
}

@Injectable()
export class MockI18nService {
  private translations = {
    vi: {
      'chatbot.greeting':
        'Xin chào! Tôi là trợ lý AI của ICC Auto Travel. Tôi có thể giúp bạn:',
      'chatbot.services_intro':
        '🚗 Dịch vụ đưa đón và thuê xe\n🏖️ Tour du lịch trọn gói\n✈️ Vé máy bay giá tốt\n🏨 Đặt phòng khách sạn',
      'chatbot.ask_service': 'Bạn muốn tìm hiểu dịch vụ nào?',
      'chatbot.tour_info': 'Tôi muốn đặt tour du lịch',
      'chatbot.transfer_info': 'Xem dịch vụ đưa đón sân bay',
      'chatbot.vehicle_info': 'Thuê xe tự lái',
      'chatbot.get_quote': 'Báo giá dịch vụ',
      'services.flight': 'Vé máy bay',
      'services.tour': 'Tour du lịch',
      'services.transfer': 'Dịch vụ đưa đón',
      'services.vehicle': 'Thuê xe',
      'services.hotel': 'Khách sạn',
      'common.hello': 'Xin chào',
      'common.success': 'Thành công',
      'common.error': 'Lỗi',
    },
    en: {
      'chatbot.greeting':
        "Hello! I'm ICC Auto Travel's AI assistant. I can help you with:",
      'chatbot.services_intro':
        '🚗 Transfer and vehicle rental services\n🏖️ Complete tour packages\n✈️ Affordable flight tickets\n🏨 Hotel bookings',
      'chatbot.ask_service': 'Which service would you like to learn about?',
      'chatbot.tour_info': 'I want to book a tour',
      'chatbot.transfer_info': 'View airport transfer services',
      'chatbot.vehicle_info': 'Rent a car',
      'chatbot.get_quote': 'Get a quote',
      'services.flight': 'Flight ticket',
      'services.tour': 'Tour',
      'services.transfer': 'Transfer service',
      'services.vehicle': 'Vehicle rental',
      'services.hotel': 'Hotel',
      'common.hello': 'Hello',
      'common.success': 'Success',
      'common.error': 'Error',
    },
    ko: {
      'chatbot.greeting':
        '안녕하세요! 저는 ICC Auto Travel의 AI 어시스턴트입니다. 다음과 같이 도움을 드릴 수 있습니다:',
      'chatbot.services_intro':
        '🚗 교통 및 차량 렌털 서비스\n🏖️ 완전한 투어 패키지\n✈️ 저렴한 항공권\n🏨 호텔 예약',
      'chatbot.ask_service': '어떤 서비스에 대해 알고 싶으신가요?',
      'chatbot.tour_info': '투어를 예약하고 싶습니다',
      'chatbot.transfer_info': '공항 교통 서비스 보기',
      'chatbot.vehicle_info': '차량 렌털',
      'chatbot.get_quote': '견적 받기',
      'services.flight': '항공권',
      'services.tour': '여행 투어',
      'services.transfer': '교통 서비스',
      'services.vehicle': '차량 렌털',
      'services.hotel': '호텔',
      'common.hello': '안녕하세요',
      'common.success': '성공',
      'common.error': '오류',
    },
  };

  translate(key: string, options: TranslationOptions = {}): string {
    const lang = options.lang || 'vi';
    const translations =
      this.translations[lang as keyof typeof this.translations] ||
      this.translations.vi;

    return translations[key as keyof typeof translations] || key;
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.translations);
  }
}
