import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TranslationService } from '../translation.service';
import { MultilingualService } from '../services/multilingual.service';
import { Multilingual } from '../decorators/multilingual.decorator';
import { MultilingualEntityDto } from '../dto/multilingual-response.dto';

@ApiTags('Multilingual Demo')
@Controller('api/v1/multilingual-demo')
export class MultilingualDemoController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly multilingualService: MultilingualService,
  ) {}

  @Get('services')
  @Multilingual()
  @ApiOperation({ summary: 'Get services with multilingual support' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiOkResponse({ 
    description: 'List of services with multilingual support',
    type: MultilingualEntityDto,
    isArray: true,
  })
  getServices(@Query('lang') lang = 'en') {
    // Demo data với các trường đa ngôn ngữ
    const services = [
      {
        id: '1',
        name_i18n: {
          en: 'Car Rental',
          vi: 'Thuê xe',
          ko: '자동차 대여',
        },
        description_i18n: {
          en: 'Luxury car rental service',
          vi: 'Dịch vụ thuê xe cao cấp',
          ko: '고급 자동차 렌탈 서비스',
        },
        price: 50,
        unit: 'USD/day',
        features: ['GPS', 'Insurance', '24/7 Support'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name_i18n: {
          en: 'Hotel Booking',
          vi: 'Đặt phòng khách sạn',
          ko: '호텔 예약',
        },
        description_i18n: {
          en: '5-star hotel booking service',
          vi: 'Dịch vụ đặt phòng khách sạn 5 sao',
          ko: '5성급 호텔 예약 서비스',
        },
        price: 100,
        unit: 'USD/night',
        features: ['Breakfast', 'WiFi', 'Swimming Pool'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return this.multilingualService.createMultilingualResponse(
      services,
      lang,
      'common.services_list_success'
    );
  }

  @Get('service/:id')
  @Multilingual()
  @ApiOperation({ summary: 'Get service details with multilingual support' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  @ApiOkResponse({
    description: 'Service details with multilingual support',
    type: MultilingualEntityDto,
  })
  getServiceDetails(@Param('id') id: string, @Query('lang') lang = 'en') {
    // Demo data với các trường đa ngôn ngữ
    const service = {
      id,
      name_i18n: {
        en: 'Car Rental',
        vi: 'Thuê xe',
        ko: '자동차 대여',
      },
      description_i18n: {
        en: 'Luxury car rental service',
        vi: 'Dịch vụ thuê xe cao cấp',
        ko: '고급 자동차 렌탈 서비스',
      },
      price: 50,
      unit: 'USD/day',
      features: ['GPS', 'Insurance', '24/7 Support'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Nested object với multilingual fields
      details: {
        includes_i18n: {
          en: 'Includes driver and fuel',
          vi: 'Bao gồm tài xế và nhiên liệu',
          ko: '운전사 및 연료 포함',
        },
        terms_i18n: {
          en: 'Terms and conditions apply',
          vi: 'Áp dụng điều khoản và điều kiện',
          ko: '이용약관이 적용됩니다',
        }
      }
    };

    return this.multilingualService.createMultilingualResponse(
      service,
      lang,
      'common.service_details_success'
    );
  }

  @Get('translations')
  @ApiOperation({ summary: 'Get translations for a specific key' })
  @ApiQuery({
    name: 'key',
    required: true,
    description: 'Translation key',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  getTranslation(@Query('key') key: string, @Query('lang') lang = 'en') {
    return {
      success: true,
      data: {
        key,
        value: this.translationService.translate(key, { lang }),
      },
      language: lang,
      meta: {
        supportedLanguages: this.translationService.getSupportedLanguages?.() || ['en', 'vi', 'ko'],
        timestamp: new Date().toISOString(),
      },
    };
  }
}
