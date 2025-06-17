import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import {
  TravelPlannerService,
  TravelRequest,
  TravelPlan,
} from './travel-planner.service';

@Controller('travel-planner')
export class TravelPlannerController {
  private readonly logger = new Logger(TravelPlannerController.name);

  constructor(private readonly travelPlannerService: TravelPlannerService) {}

  @Post('create-plan')
  async createTravelPlan(@Body() request: TravelRequest): Promise<TravelPlan> {
    this.logger.log(`Creating travel plan for ${request.destination}`);

    try {
      // Chuyển đổi string dates thành Date objects
      const processedRequest = {
        ...request,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
      };

      const travelPlan =
        await this.travelPlannerService.createIntelligentTravelPlan(
          processedRequest,
        );

      this.logger.log(
        `Travel plan created successfully with ${travelPlan.suggestedServices.length} suggested services`,
      );
      return travelPlan;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating travel plan: ${errorMessage}`);
      throw error;
    }
  }

  @Get('quick-suggestions')
  async getQuickSuggestions(
    @Query('destination') destination: string,
    @Query('serviceType') serviceType?: string,
  ) {
    this.logger.log(`Getting quick suggestions for ${destination}`);

    try {
      const suggestions =
        await this.travelPlannerService.getServiceRecommendations(
          destination,
          serviceType,
        );

      return {
        destination,
        serviceType: serviceType || 'all',
        suggestions,
        count: suggestions.length,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting suggestions: ${errorMessage}`);
      throw error;
    }
  }

  @Post('analyze-destination')
  async analyzeDestination(@Body() body: { destination: string }) {
    this.logger.log(`Analyzing destination: ${body.destination}`);

    try {
      // Tạo một travel request mẫu để phân tích
      const sampleRequest: TravelRequest = {
        destination: body.destination,
        origin: 'TP.HCM',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày
        travelers: 2,
        budget: 10000000, // 10 triệu
        preferences: ['tham quan', 'ẩm thực'],
        travelType: 'leisure',
      };

      const analysis =
        await this.travelPlannerService.createIntelligentTravelPlan(
          sampleRequest,
        );

      return {
        destination: body.destination,
        feasibilityScore: analysis.feasibilityScore,
        estimatedCost: analysis.totalEstimatedCost,
        availableServices: analysis.suggestedServices.length,
        serviceTypes: [
          ...new Set(analysis.suggestedServices.map((s) => s.serviceType)),
        ],
        summary:
          analysis.itinerary?.summary ||
          'Đích đến hấp dẫn với nhiều hoạt động thú vị',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error analyzing destination: ${errorMessage}`);
      throw error;
    }
  }

  @Get('popular-destinations')
  async getPopularDestinations() {
    const popularDestinations = [
      {
        name: 'Đà Lạt',
        distance: 308,
        vehicleAvailable: false, // > 300km
        flightRecommended: true,
        estimatedCost: 5000000,
        highlights: ['Thác Elephant', 'Hồ Xuân Hương', 'Dinh Bảo Đại'],
      },
      {
        name: 'Vũng Tàu',
        distance: 125,
        vehicleAvailable: true, // < 300km
        flightRecommended: false,
        estimatedCost: 2500000,
        highlights: ['Bãi Trước', 'Tượng Chúa Kitô', 'Ngọn Hải Đăng'],
      },
      {
        name: 'Đà Nẵng',
        distance: 964,
        vehicleAvailable: false, // > 300km
        flightRecommended: true,
        estimatedCost: 7000000,
        highlights: ['Cầu Rồng', 'Bà Nà Hills', 'Bãi biển Mỹ Khê'],
      },
      {
        name: 'Cần Thơ',
        distance: 169,
        vehicleAvailable: true, // < 300km
        flightRecommended: false,
        estimatedCost: 3000000,
        highlights: ['Chợ nổi Cái Răng', 'Vườn cò Bằng Lăng', 'Bến Ninh Kiều'],
      },
      {
        name: 'Phú Quốc',
        distance: 565,
        vehicleAvailable: false, // > 300km + island
        flightRecommended: true,
        estimatedCost: 8000000,
        highlights: [
          'Sunset Sanato Beach',
          'Cáp treo Hòn Thơm',
          'Chợ đêm Dinh Cậu',
        ],
      },
    ];

    return {
      destinations: popularDestinations,
      serviceRadius: {
        vehicle: '300km từ TP.HCM',
        tour: '500km từ TP.HCM',
        hotel: 'Không giới hạn',
        flight: 'Không giới hạn',
      },
      note: 'Dịch vụ thuê xe chỉ áp dụng trong bán kính 300km từ TP.HCM',
    };
  }
}
