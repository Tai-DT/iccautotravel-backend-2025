import { Injectable } from '@nestjs/common';
import { ChatMessage } from './ai.service';
import { MockI18nService } from './mock-i18n.service';

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: ChatAction[];
  metadata?: any;
}

export interface ChatAction {
  type: 'book_service' | 'view_details' | 'contact_support' | 'get_quote';
  label: string;
  data?: any;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly i18n: MockI18nService) {}

  private readonly knowledgeBase = {
    greetings: [
      'Xin chào! Tôi là trợ lý AI của ICC Auto Travel. Tôi có thể giúp gì cho bạn?',
      'Chào bạn! Tôi có thể hỗ trợ bạn về các dịch vụ du lịch và vận chuyển.',
      "Hello! I'm your ICC Auto Travel AI assistant. How can I help you today?",
    ],
    services: {
      transfer: {
        description: 'Dịch vụ đưa đón sân bay và di chuyển trong thành phố',
        price_range: '200,000 - 500,000 VND',
        features: ['Xe đời mới', 'Tài xế kinh nghiệm', 'Đúng giờ', 'An toàn'],
      },
      tour: {
        description: 'Tour du lịch trọn gói với hướng dẫn viên chuyên nghiệp',
        price_range: '800,000 - 3,000,000 VND',
        features: ['Hướng dẫn viên', 'Bữa ăn', 'Khách sạn', 'Bảo hiểm'],
      },
      vehicle: {
        description: 'Thuê xe tự lái hoặc có tài xế',
        price_range: '600,000 - 1,500,000 VND/ngày',
        features: ['Xe mới', 'Bảo hiểm', 'Hỗ trợ 24/7', 'Không cọc'],
      },
      hotel: {
        description: 'Đặt phòng khách sạn với giá tốt nhất',
        price_range: '500,000 - 5,000,000 VND/đêm',
        features: [
          'Xác nhận ngay',
          'Hủy miễn phí',
          'Đánh giá cao',
          'Vị trí thuận lợi',
        ],
      },
      flight: {
        description: 'Vé máy bay giá rẻ các hãng hàng không',
        price_range: '1,000,000 - 10,000,000 VND',
        features: [
          'Giá tốt nhất',
          'Đổi vé linh hoạt',
          'Hỗ trợ 24/7',
          'Check-in online',
        ],
      },
    },
    faqs: [
      {
        question: ['đặt chỗ', 'booking', 'book', 'đặt'],
        answer:
          'Để đặt chỗ, bạn có thể: 1) Gọi hotline 1900-1234, 2) Đặt online qua website, 3) Chat với tôi ngay bây giờ để được hỗ trợ.',
        actions: [
          {
            type: 'book_service',
            label: 'Đặt ngay',
            data: { action: 'start_booking' },
          },
          {
            type: 'contact_support',
            label: 'Gọi hotline',
            data: { phone: '1900-1234' },
          },
        ],
      },
      {
        question: ['giá', 'price', 'cost', 'phí', 'tiền'],
        answer:
          'Giá dịch vụ phụ thuộc vào loại hình và thời gian. Tôi có thể báo giá cụ thể nếu bạn cho tôi biết: 1) Dịch vụ cần dùng, 2) Thời gian, 3) Số người.',
        actions: [
          {
            type: 'get_quote',
            label: 'Xem báo giá',
            data: { action: 'get_quote' },
          },
        ],
      },
      {
        question: ['hủy', 'cancel', 'refund', 'hoàn tiền'],
        answer:
          'Chính sách hủy: 1) Hủy trước 24h: hoàn 100%, 2) Hủy trước 12h: hoàn 50%, 3) Hủy dưới 12h: không hoàn tiền. Một số dịch vụ có chính sách riêng.',
        actions: [
          {
            type: 'contact_support',
            label: 'Hỗ trợ hủy vé',
            data: { action: 'cancel_booking' },
          },
        ],
      },
      {
        question: ['thanh toán', 'payment', 'pay'],
        answer:
          'Chúng tôi nhận nhiều hình thức thanh toán: 1) Thẻ tín dụng/ghi nợ, 2) Chuyển khoản, 3) Ví điện tử (MoMo, ZaloPay), 4) Tiền mặt.',
      },
    ],
  };

  async processMessage(chatMessage: ChatMessage): Promise<ChatResponse> {
    const { message, language = 'vi' } = chatMessage;
    const lowerMessage = message.toLowerCase();

    // Greeting detection
    if (this.isGreeting(lowerMessage)) {
      return {
        message:
          this.i18n.translate('chatbot.greeting', { lang: language }) +
          '\n\n' +
          this.i18n.translate('chatbot.services_intro', { lang: language }) +
          '\n\n' +
          this.i18n.translate('chatbot.ask_service', { lang: language }),
        suggestions: [
          this.i18n.translate('chatbot.tour_info', { lang: language }),
          this.i18n.translate('chatbot.transfer_info', { lang: language }),
          this.i18n.translate('chatbot.vehicle_info', { lang: language }),
          this.i18n.translate('services.flight', { lang: language }),
          this.i18n.translate('chatbot.get_quote', { lang: language }),
        ],
      };
    }

    // Service inquiry
    const serviceType = this.detectServiceType(lowerMessage);
    if (serviceType) {
      const service =
        this.knowledgeBase.services[
          serviceType as keyof typeof this.knowledgeBase.services
        ];
      return {
        message: `${service.description}\n\n📍 Giá: ${service.price_range}\n✨ Tính năng: ${service.features.join(', ')}`,
        actions: [
          { type: 'book_service', label: 'Đặt ngay', data: { serviceType } },
          {
            type: 'get_quote',
            label: 'Xem báo giá chi tiết',
            data: { serviceType },
          },
        ],
        suggestions: [
          'Tôi muốn đặt dịch vụ này',
          'Xem các dịch vụ khác',
          'Báo giá chi tiết',
        ],
      };
    }

    // FAQ matching
    const faqMatch = this.findFAQMatch(lowerMessage);
    if (faqMatch) {
      return {
        message: faqMatch.answer,
        actions: faqMatch.actions || [],
        suggestions: ['Tôi cần hỗ trợ thêm', 'Xem dịch vụ khác', 'Cảm ơn'],
      };
    }

    // Location-based suggestions
    const location = this.detectLocation(lowerMessage);
    if (location) {
      return {
        message: `Tôi tìm thấy nhiều dịch vụ tại ${location}! Bạn quan tâm đến:`,
        actions: [
          {
            type: 'view_details',
            label: `Tour ${location}`,
            data: { location, type: 'tour' },
          },
          {
            type: 'view_details',
            label: `Transfer tại ${location}`,
            data: { location, type: 'transfer' },
          },
          {
            type: 'view_details',
            label: `Khách sạn ${location}`,
            data: { location, type: 'hotel' },
          },
        ],
        suggestions: [
          `Tour du lịch ${location}`,
          `Thuê xe tại ${location}`,
          `Khách sạn ${location}`,
        ],
      };
    }

    // Default response with smart suggestions
    return {
      message:
        'Tôi có thể giúp bạn về:\n\n🚗 Dịch vụ đưa đón và thuê xe\n🏖️ Tour du lịch trọn gói\n✈️ Vé máy bay giá tốt\n🏨 Đặt phòng khách sạn\n\nBạn muốn tìm hiểu dịch vụ nào?',
      suggestions: [
        'Dịch vụ đưa đón sân bay',
        'Tour du lịch 2-3 ngày',
        'Thuê xe tự lái',
        'Vé máy bay giá rẻ',
        'Khách sạn 4-5 sao',
      ],
      actions: [
        {
          type: 'contact_support',
          label: 'Gọi tư vấn viên',
          data: { phone: '1900-1234' },
        },
      ],
    };
  }

  private isGreeting(message: string): boolean {
    const greetings = [
      'xin chào',
      'chào',
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
    ];
    return greetings.some((greeting) => message.includes(greeting));
  }

  private getRandomGreeting(): string {
    const greetings = this.knowledgeBase.greetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private detectServiceType(message: string): string | null {
    const serviceKeywords = {
      transfer: ['đưa đón', 'transfer', 'sân bay', 'airport', 'pickup'],
      tour: ['tour', 'du lịch', 'travel', 'trip', 'tham quan'],
      vehicle: ['thuê xe', 'rent car', 'rental', 'tự lái', 'self drive'],
      hotel: ['khách sạn', 'hotel', 'phòng', 'room', 'nghỉ'],
      flight: ['máy bay', 'flight', 'vé bay', 'plane', 'airline'],
    };

    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some((keyword) => message.includes(keyword))) {
        return service;
      }
    }
    return null;
  }

  private findFAQMatch(message: string): any {
    return this.knowledgeBase.faqs.find((faq) =>
      faq.question.some((keyword) => message.includes(keyword)),
    );
  }

  private detectLocation(message: string): string | null {
    const locations = [
      'hà nội',
      'hanoi',
      'sài gòn',
      'hồ chí minh',
      'saigon',
      'đà nẵng',
      'da nang',
      'hạ long',
      'halong',
      'nha trang',
      'đà lạt',
      'dalat',
      'phú quốc',
      'phu quoc',
      'vũng tàu',
      'vung tau',
      'hội an',
      'hoi an',
      'huế',
      'hue',
      'sapa',
      'sa pa',
    ];

    for (const location of locations) {
      if (message.includes(location)) {
        return location.charAt(0).toUpperCase() + location.slice(1);
      }
    }
    return null;
  }
}
