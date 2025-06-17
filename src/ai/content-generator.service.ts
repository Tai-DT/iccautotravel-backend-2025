import { Injectable } from '@nestjs/common';

export interface ContentGenerationResult {
  content: string;
  metadata?: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
    seoScore?: number;
  };
}

@Injectable()
export class ContentGeneratorService {
  async generateContent(
    type: string,
    data: any,
  ): Promise<ContentGenerationResult> {
    switch (type) {
      case 'service_description':
        return this.generateServiceDescription(data);
      case 'tour_itinerary':
        return this.generateTourItinerary(data);
      case 'seo_content':
        return this.generateSEOContent(data);
      case 'social_post':
        return this.generateSocialPost(data);
      case 'email_marketing':
        return this.generateEmailMarketing(data);
      case 'blog_post':
        return this.generateBlogPost(data);
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  private async generateServiceDescription(
    data: any,
  ): Promise<ContentGenerationResult> {
    const { serviceName, serviceType, features, price, location } = data;

    const templates = {
      TRANSFER: [
        `Trải nghiệm dịch vụ đưa đón ${serviceName} với chất lượng hàng đầu. Đội ngũ tài xế chuyên nghiệp, xe đời mới, cam kết đúng giờ và an toàn tuyệt đối.`,
        `${serviceName} - Giải pháp di chuyển thông minh cho mọi hành trình. Với ${features?.join(', ')}, chúng tôi mang đến trải nghiệm thoải mái và tiện lợi nhất.`,
      ],
      TOUR: [
        `Khám phá ${location} với ${serviceName} - hành trình đầy cảm xúc và khó quên. ${features?.join(', ')} sẽ làm cho chuyến đi của bạn trở nên hoàn hảo.`,
        `${serviceName} mang đến cho bạn trải nghiệm du lịch authentic tại ${location}. Với ${features?.join(', ')}, mỗi khoảnh khắc đều trở thành kỷ niệm đẹp.`,
      ],
      VEHICLE: [
        `Thuê xe ${serviceName} - Tự do khám phá mọi nẻo đường. Với ${features?.join(', ')}, chuyến đi của bạn sẽ an toàn và thoải mái.`,
        `${serviceName} - Đồng hành cùng mọi hành trình. Xe mới, bảo hiểm toàn diện, hỗ trợ 24/7 cho chuyến đi hoàn hảo.`,
      ],
    };

    const templateArray = templates[serviceType as keyof typeof templates] || [
      `${serviceName} - Dịch vụ chất lượng cao với ${features?.join(', ')}. Trải nghiệm đẳng cấp với giá cả hợp lý.`,
    ];

    const content =
      templateArray[Math.floor(Math.random() * templateArray.length)];

    return {
      content:
        content +
        `\n\n💰 Giá từ: ${price?.toLocaleString('vi-VN')} VND\n📍 Khu vực: ${location}\n🌟 Đặt ngay để nhận ưu đãi tốt nhất!`,
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: Math.ceil(content.split(' ').length / 200),
        keywords: this.extractKeywords(content),
        seoScore: 85,
      },
    };
  }

  private async generateTourItinerary(
    data: any,
  ): Promise<ContentGenerationResult> {
    const { tourName, duration, destination, activities } = data;

    const itineraries = {
      '1-day': [
        '06:00 - Khởi hành từ điểm hẹn',
        '08:00 - Tham quan điểm đầu tiên',
        '10:00 - Nghỉ ngơi, chụp ảnh',
        '12:00 - Dùng bữa trưa',
        '14:00 - Tham quan điểm thứ hai',
        '16:00 - Mua sắm đặc sản',
        '18:00 - Kết thúc tour, trở về',
      ],
      '2-day': [
        'NGÀY 1:',
        '06:00 - Khởi hành từ điểm hẹn',
        '10:00 - Tham quan danh lam thắng cảnh',
        '12:00 - Dùng bữa trưa đặc sản',
        '14:00 - Check-in khách sạn',
        '16:00 - Tự do khám phá địa phương',
        '19:00 - Dùng bữa tối',
        '',
        'NGÀY 2:',
        '07:00 - Ăn sáng',
        '08:00 - Tham quan điểm nổi tiếng',
        '11:00 - Trải nghiệm văn hóa địa phương',
        '12:00 - Dùng bữa trưa',
        '14:00 - Mua sắm kỷ niệm',
        '16:00 - Khởi hành về',
      ],
    };

    const dayType = duration.includes('1') ? '1-day' : '2-day';
    const baseItinerary = itineraries[dayType] || itineraries['1-day'];

    const content =
      `🗓️ LỊCH TRÌNH TOUR ${tourName.toUpperCase()}\n\n` +
      baseItinerary.join('\n') +
      `\n\n📍 Điểm đến: ${destination}\n⏰ Thời gian: ${duration}\n🎯 Hoạt động: ${activities?.join(', ') || 'Tham quan, ẩm thực, văn hóa'}`;

    return {
      content,
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: Math.ceil(content.split(' ').length / 200),
        keywords: [tourName, destination, ...(activities || [])],
      },
    };
  }

  private async generateSEOContent(
    data: any,
  ): Promise<ContentGenerationResult> {
    const { title, keywords, contentType } = data;

    const seoTemplates = {
      meta_description: `${title} - Dịch vụ chất lượng cao, giá cả hợp lý. Đặt ngay để nhận ưu đãi tốt nhất. Hotline: 1900-1234`,
      title_tag: `${title} | ICC Auto Travel - Dịch vụ Du lịch Uy tín`,
      heading: `${title} - Trải nghiệm đẳng cấp cùng ICC Auto Travel`,
    };

    const content =
      seoTemplates[contentType as keyof typeof seoTemplates] ||
      seoTemplates.meta_description;

    return {
      content,
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: 1,
        keywords: keywords || this.extractKeywords(content),
        seoScore: 92,
      },
    };
  }

  private async generateSocialPost(
    data: any,
  ): Promise<ContentGenerationResult> {
    const { serviceName, serviceType, promotion, platform } = data;

    const socialTemplates = {
      facebook: [
        `🌟 ${serviceName} - Trải nghiệm tuyệt vời đang chờ bạn!\n\n${promotion}\n\n#DuLich #ICCAutoTravel #Vietnam`,
        `🚗 Hành trình của bạn bắt đầu từ ${serviceName}!\n\n✅ Chất lượng đảm bảo\n✅ Giá cả hợp lý\n✅ Dịch vụ chuyên nghiệp\n\n${promotion}`,
      ],
      instagram: [
        `✨ ${serviceName} ✨\n\n📸 Tạo những kỷ niệm đẹp\n🌍 Khám phá Việt Nam\n💫 Trải nghiệm đẳng cấp\n\n${promotion}\n\n#Travel #Vietnam #ICCAutoTravel`,
      ],
    };

    const templates =
      socialTemplates[platform as keyof typeof socialTemplates] ||
      socialTemplates.facebook;
    const content = templates[Math.floor(Math.random() * templates.length)];

    return {
      content,
      metadata: {
        wordCount: content.split(' ').length,
        readingTime: 1,
        keywords: [serviceName, serviceType, 'du lịch', 'vietnam'],
      },
    };
  }

  private async generateEmailMarketing(
    data: any,
  ): Promise<ContentGenerationResult> {
    const { customerName, serviceName, promotion, ctaText } = data;

    const emailTemplate = `
Chào ${customerName || 'bạn'},

🎉 Tin tuyệt vời dành cho bạn!

${serviceName} đang có chương trình ưu đãi đặc biệt:

${promotion}

Đây là cơ hội tuyệt vời để bạn trải nghiệm dịch vụ chất lượng cao với giá ưu đãi nhất.

✅ Dịch vụ chuyên nghiệp
✅ Đội ngũ tận tâm  
✅ Giá cả hợp lý
✅ An toàn tuyệt đối

${ctaText || 'Đặt ngay hôm nay!'} - Liên hệ: 1900-1234

Trân trọng,
ICC Auto Travel Team

---
Bạn nhận được email này vì đã đăng ký nhận thông tin từ ICC Auto Travel.
Nếu không muốn nhận email, vui lòng click vào đây để hủy đăng ký.
    `.trim();

    return {
      content: emailTemplate,
      metadata: {
        wordCount: emailTemplate.split(' ').length,
        readingTime: Math.ceil(emailTemplate.split(' ').length / 200),
        keywords: [serviceName, 'ưu đãi', 'du lịch'],
      },
    };
  }

  private async generateBlogPost(data: any): Promise<ContentGenerationResult> {
    const { topic, destination, keywords } = data;

    const blogTemplate = `
# ${topic}

${destination} luôn là một trong những điểm đến hấp dẫn nhất, thu hút hàng triệu du khách mỗi năm. Với vẻ đẹp tự nhiên kết hợp văn hóa đặc sắc, nơi đây mang đến những trải nghiệm khó quên.

## Điểm nổi bật của ${destination}

1. **Cảnh quan thiên nhiên tuyệt đẹp**: Những khung cảnh ngoạn mục sẽ làm bạn phải trầm trồ
2. **Văn hóa độc đáo**: Trải nghiệm văn hóa bản địa authentic
3. **Ẩm thực phong phú**: Thưởng thức các món ăn đặc sản hấp dẫn
4. **Con người thân thiện**: Người dân địa phương luôn chào đón du khách

## Kinh nghiệm du lịch ${destination}

### Thời điểm tốt nhất
Mỗi mùa đều có nét đẹp riêng, nhưng tháng X đến tháng Y là thời gian lý tưởng nhất để ghé thăm.

### Phương tiện di chuyển
ICC Auto Travel cung cấp đầy đủ các phương tiện từ xe riêng, tour trọn gói đến dịch vụ đưa đón.

### Lưu trú
Từ khách sạn 5 sao đến homestay ấm cúng, chúng tôi có đầy đủ lựa chọn phù hợp mọi ngân sách.

## Lời kết

${destination} đang chờ đón bạn với những trải nghiệm tuyệt vời. Hãy để ICC Auto Travel đồng hành cùng hành trình khám phá của bạn!

**Liên hệ đặt tour:** 1900-1234
**Website:** www.iccautotravel.com
    `.trim();

    return {
      content: blogTemplate,
      metadata: {
        wordCount: blogTemplate.split(' ').length,
        readingTime: Math.ceil(blogTemplate.split(' ').length / 200),
        keywords: keywords || [destination, 'du lịch', 'tour', 'trải nghiệm'],
        seoScore: 88,
      },
    };
  }

  private extractKeywords(content: string): string[] {
    const commonWords = [
      'và',
      'của',
      'với',
      'để',
      'từ',
      'tại',
      'trong',
      'cho',
      'về',
      'có',
      'là',
    ];
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word) => word.length > 3 && !commonWords.includes(word));

    return [...new Set(words)].slice(0, 10);
  }
}
