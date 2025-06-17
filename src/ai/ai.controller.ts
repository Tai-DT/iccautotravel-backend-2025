import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AIService, ChatMessage, RecommendationRequest } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  async processChat(@Body() chatMessage: ChatMessage) {
    return this.aiService.processChat(chatMessage);
  }

  @Post('recommendations')
  async getRecommendations(@Body() request: RecommendationRequest) {
    return this.aiService.getRecommendations(request);
  }

  @Post('content/generate')
  async generateContent(@Body() data: { type: string; data: any }) {
    return this.aiService.generateContent(data.type, data.data);
  }

  @Get('user-analysis/:userId')
  @UseGuards(JwtAuthGuard)
  async analyzeUser(@Param('userId') userId: string) {
    return this.aiService.analyzeUserBehavior(userId);
  }

  @Post('pricing/optimize')
  @UseGuards(JwtAuthGuard)
  async optimizePrice(@Body() data: { serviceId: string; marketData: any }) {
    return this.aiService.optimizePrice(data.serviceId, data.marketData);
  }

  // Demo endpoints for testing
  @Get('demo/chat')
  async demoChat(@Query('message') message: string) {
    const chatMessage: ChatMessage = {
      message: message || 'Xin chào',
      language: 'vi',
    };
    return this.aiService.processChat(chatMessage);
  }

  @Get('demo/recommendations')
  async demoRecommendations(
    @Query('budget') budget?: string,
    @Query('location') location?: string,
    @Query('serviceType') serviceType?: string,
  ) {
    const request: RecommendationRequest = {
      budget: budget ? parseInt(budget) : undefined,
      location,
      serviceType,
    };
    return this.aiService.getRecommendations(request);
  }

  @Get('demo/content/:type')
  async demoContent(@Param('type') type: string) {
    const mockData = {
      service_description: {
        serviceName: 'Transfer sân bay Nội Bài',
        serviceType: 'TRANSFER',
        features: ['Xe đời mới', 'Tài xế chuyên nghiệp', 'Đúng giờ'],
        price: 250000,
        location: 'Hà Nội',
      },
      tour_itinerary: {
        tourName: 'Tour Hạ Long',
        duration: '2 ngày 1 đêm',
        destination: 'Hạ Long',
        activities: ['Du thuyền', 'Thăm hang động', 'Ẩm thực'],
      },
      social_post: {
        serviceName: 'Tour Sapa 3N2Đ',
        serviceType: 'TOUR',
        promotion: 'Giảm 20% cho nhóm từ 4 người',
        platform: 'facebook',
      },
    };

    const data =
      mockData[type as keyof typeof mockData] || mockData.service_description;
    return this.aiService.generateContent(type, data);
  }
}
