import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Multilingual } from '../../i18n/decorators/multilingual.decorator';
import { MultilingualService } from '../../i18n/services/multilingual.service';

@ApiTags('Blog Multilingual')
@Controller('api/v1/blogs')
@Multilingual()
export class BlogMultilingualController {
  constructor(private readonly multilingualService: MultilingualService) {}

  @Get()
  @ApiOperation({ summary: 'Get blog posts with multilingual support' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  getBlogs(@Query('lang') lang = 'en') {
    // Sample blog data with multilingual fields
    const blogs = [
      {
        id: '1',
        title_i18n: {
          en: 'Top 10 Tourist Attractions in Vietnam',
          vi: '10 Địa Điểm Du Lịch Hàng Đầu ở Việt Nam',
          ko: '베트남의 10대 관광 명소'
        },
        content_i18n: {
          en: 'Vietnam has many beautiful places to visit...',
          vi: 'Việt Nam có nhiều địa điểm du lịch tuyệt đẹp...',
          ko: '베트남에는 방문할 아름다운 곳이 많이 있습니다...'
        },
        author: 'John Doe',
        tags: ['travel', 'vietnam', 'tourism'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title_i18n: {
          en: 'Vietnamese Cuisine: A Culinary Journey',
          vi: 'Ẩm Thực Việt Nam: Một Hành Trình Khám Phá',
          ko: '베트남 요리: 요리 여행'
        },
        content_i18n: {
          en: 'Explore the rich flavors and traditions of Vietnamese cuisine...',
          vi: 'Khám phá hương vị phong phú và truyền thống của ẩm thực Việt Nam...',
          ko: '베트남 요리의 풍부한 맛과 전통을 탐험하세요...'
        },
        author: 'Jane Smith',
        tags: ['food', 'cuisine', 'vietnam'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return this.multilingualService.createMultilingualResponse(
      blogs,
      lang,
      'blog.list_success'
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured blog posts with multilingual support' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (en, vi, ko)',
  })
  getFeaturedBlogs(@Query('lang') lang = 'en') {
    // Featured blog with multilingual fields
    const featuredBlog = {
      id: '3',
      title_i18n: {
        en: 'Ultimate Guide to Traveling in Vietnam',
        vi: 'Hướng Dẫn Tối Ưu Cho Du Lịch Tại Việt Nam',
        ko: '베트남 여행 최종 가이드'
      },
      excerpt_i18n: {
        en: 'Everything you need to know before your Vietnam trip',
        vi: 'Tất cả những điều bạn cần biết trước chuyến đi Việt Nam',
        ko: '베트남 여행 전에 알아야 할 모든 것'
      },
      featured: true,
      imageUrl: 'https://example.com/vietnam-travel.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categories: [
        {
          id: '1',
          name_i18n: {
            en: 'Travel Guide',
            vi: 'Hướng Dẫn Du Lịch',
            ko: '여행 가이드'
          }
        },
        {
          id: '2',
          name_i18n: {
            en: 'Vietnam',
            vi: 'Việt Nam',
            ko: '베트남'
          }
        }
      ]
    };

    return this.multilingualService.createMultilingualResponse(
      featuredBlog,
      lang,
      'blog.featured_success'
    );
  }
}
