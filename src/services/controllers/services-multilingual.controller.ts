import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Multilingual } from '../../i18n/decorators/multilingual.decorator';
import { MultilingualService } from '../../i18n/services/multilingual.service';
import { MultilingualEntityDto } from '../../i18n/dto/multilingual-response.dto';

@ApiTags('Services API')
@Controller('api/v1/services')
@Multilingual()
export class ServicesMultilingualController {
  constructor(
    private readonly multilingualService: MultilingualService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all services with multilingual support' })
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
  getAllServices(@Query('lang') lang = 'en') {
    // Example data with multilingual fields
    const services = [
      {
        id: '1',
        name_i18n: {
          en: 'Airport Transfer',
          vi: 'Đưa đón sân bay',
          ko: '공항 환승'
        },
        description_i18n: {
          en: 'Comfortable airport pickup and drop-off service',
          vi: 'Dịch vụ đón và trả khách tại sân bay thoải mái',
          ko: '편안한 공항 픽업 및 하차 서비스'
        },
        price: 30,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name_i18n: {
          en: 'City Tour',
          vi: 'Tour thành phố',
          ko: '도시 투어'
        },
        description_i18n: {
          en: 'Explore the city with our experienced guides',
          vi: 'Khám phá thành phố với hướng dẫn viên giàu kinh nghiệm của chúng tôi',
          ko: '경험이 풍부한 가이드와 함께 도시를 탐험하세요'
        },
        price: 50,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return this.multilingualService.createMultilingualResponse(
      services,
      lang,
      'common.services_list_success'
    );
  }

  @Get(':id')
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
    // Sample service data with multilingual fields
    const service = {
      id,
      name_i18n: {
        en: 'Airport Transfer',
        vi: 'Đưa đón sân bay',
        ko: '공항 환승'
      },
      description_i18n: {
        en: 'Comfortable airport pickup and drop-off service',
        vi: 'Dịch vụ đón và trả khách tại sân bay thoải mái',
        ko: '편안한 공항 픽업 및 하차 서비스'
      },
      price: 30,
      currency: 'USD',
      features_i18n: {
        en: ['Professional driver', 'Free waiting time', 'Flight tracking'],
        vi: ['Tài xế chuyên nghiệp', 'Thời gian chờ miễn phí', 'Theo dõi chuyến bay'],
        ko: ['전문 운전기사', '무료 대기 시간', '항공편 추적']
      },
      options: [
        {
          id: '1',
          name_i18n: {
            en: 'Standard Car',
            vi: 'Xe tiêu chuẩn',
            ko: '표준 자동차'
          },
          price: 30
        },
        {
          id: '2',
          name_i18n: {
            en: 'Premium Van',
            vi: 'Xe van cao cấp',
            ko: '프리미엄 밴'
          },
          price: 50
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.multilingualService.createMultilingualResponse(
      service,
      lang,
      'common.service_details_success'
    );
  }
}
