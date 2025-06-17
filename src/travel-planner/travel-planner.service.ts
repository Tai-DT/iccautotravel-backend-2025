import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAIService } from '../ai/google-ai.service';
import { GoongService } from '../goong/goong.service';

export interface TravelRequest {
  destination: string;
  origin?: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget?: number;
  preferences?: string[];
  travelType?: 'leisure' | 'business' | 'family' | 'adventure';
}

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  serviceType: string;
  price: number;
  reason: string;
  priority: number;
  available: boolean;
  distance?: number;
}

export interface TravelPlan {
  itinerary: any;
  suggestedServices: ServiceSuggestion[];
  totalEstimatedCost: number;
  feasibilityScore: number;
}

@Injectable()
export class TravelPlannerService {
  private readonly logger = new Logger(TravelPlannerService.name);

  // Bán kính dịch vụ tính bằng km
  private readonly SERVICE_RADIUS = {
    VEHICLE: 300, // 300km từ HCM cho thuê xe
    TOUR: 500, // 500km cho tour
    HOTEL: 1000, // Không giới hạn cho khách sạn
    FLIGHT: Infinity, // Không giới hạn cho máy bay
  };

  private readonly HCM_COORDINATES = {
    lat: 10.8231,
    lng: 106.6297,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAIService: GoogleAIService,
    private readonly goongService: GoongService,
  ) {}

  async createIntelligentTravelPlan(
    request: TravelRequest,
  ): Promise<TravelPlan> {
    this.logger.log(`Creating travel plan for ${request.destination}`);

    try {
      // 1. Tạo lịch trình bằng AI
      const aiItinerary = await this.generateAIItinerary(request);

      // 2. Lấy tọa độ địa điểm đích
      const destinationCoords = await this.getDestinationCoordinates(
        request.destination,
      );

      // 3. Tính khoảng cách từ HCM đến đích
      const distanceFromHCM = await this.calculateDistance(
        this.HCM_COORDINATES,
        destinationCoords,
      );

      // 4. Gợi ý dịch vụ phù hợp
      const suggestedServices = await this.suggestRelevantServices(
        request,
        destinationCoords,
        distanceFromHCM,
        aiItinerary,
      );

      // 5. Tính toán chi phí và tỷ lệ khả thi
      const totalCost = this.calculateTotalCost(suggestedServices);
      const feasibilityScore = this.calculateFeasibilityScore(
        request,
        suggestedServices,
        distanceFromHCM,
      );

      return {
        itinerary: aiItinerary,
        suggestedServices,
        totalEstimatedCost: totalCost,
        feasibilityScore,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating travel plan: ${errorMessage}`);
      throw error;
    }
  }

  private async generateAIItinerary(request: TravelRequest): Promise<any> {
    try {
      return await this.googleAIService.generateTravelSuggestions({
        origin: request.origin || 'TP.HCM',
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
        preferences: request.preferences,
        budget: request.budget,
        travelType: request.travelType,
      });
    } catch (error: unknown) {
      this.logger.warn('AI itinerary generation failed, using fallback');
      // Fallback itinerary
      const days = Math.ceil(
        (request.endDate.getTime() - request.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        summary: `Chuyến du lịch ${days} ngày đến ${request.destination}`,
        days: [],
        totalEstimatedCost: request.budget || 5000000,
        recommendations: {
          transportation: ['Máy bay', 'Xe khách', 'Thuê xe'],
          accommodation: ['Khách sạn 3-4 sao'],
          dining: ['Ẩm thực địa phương'],
          tips: ['Mang theo đồ chống nắng', 'Kiểm tra thời tiết'],
        },
      };
    }
  }

  private async getDestinationCoordinates(
    destination: string,
  ): Promise<{ lat: number; lng: number }> {
    try {
      const geocodeResult = await this.goongService.geocode(destination);

      if (geocodeResult.results && geocodeResult.results.length > 0) {
        const location = geocodeResult.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      throw new Error(`Cannot geocode destination: ${destination}`);
    } catch (error: unknown) {
      this.logger.error(`Geocoding error, using fallback coordinates`);
      // Fallback coordinates for popular destinations
      return this.getFallbackCoordinates(destination) || this.HCM_COORDINATES;
    }
  }

  private getFallbackCoordinates(
    destination: string,
  ): { lat: number; lng: number } | null {
    const destinations: Record<string, { lat: number; lng: number }> = {
      'đà lạt': { lat: 11.9404, lng: 108.4583 },
      'da lat': { lat: 11.9404, lng: 108.4583 },
      'hà nội': { lat: 21.0285, lng: 105.8542 },
      hanoi: { lat: 21.0285, lng: 105.8542 },
      'đà nẵng': { lat: 16.0471, lng: 108.2068 },
      'da nang': { lat: 16.0471, lng: 108.2068 },
      'nha trang': { lat: 12.2388, lng: 109.1967 },
      'phú quốc': { lat: 10.2899, lng: 103.984 },
      'phu quoc': { lat: 10.2899, lng: 103.984 },
      'vũng tàu': { lat: 10.4113, lng: 107.1365 },
      'vung tau': { lat: 10.4113, lng: 107.1365 },
    };

    const key = destination.toLowerCase().trim();
    return destinations[key] || null;
  }

  private async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<number> {
    // Sử dụng Haversine formula để tính khoảng cách
    const R = 6371; // Bán kính trái đất (km)
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    this.logger.log(`Distance calculated: ${distance.toFixed(2)}km`);
    return distance;
  }

  private async suggestRelevantServices(
    request: TravelRequest,
    destinationCoords: { lat: number; lng: number },
    distanceFromHCM: number,
    itinerary: any,
  ): Promise<ServiceSuggestion[]> {
    const suggestions: ServiceSuggestion[] = [];

    try {
      // 1. Gợi ý dịch vụ xe (chỉ nếu trong bán kính 300km)
      if (distanceFromHCM <= this.SERVICE_RADIUS.VEHICLE) {
        const vehicleServices = await this.suggestVehicleServices(
          request,
          distanceFromHCM,
        );
        suggestions.push(...vehicleServices);
      }

      // 2. Gợi ý vé máy bay (nếu khoảng cách xa hoặc có yêu cầu)
      if (distanceFromHCM > 200 || request.preferences?.includes('máy bay')) {
        const flightServices = await this.suggestFlightServices(
          request,
          destinationCoords,
        );
        suggestions.push(...flightServices);
      }

      // 3. Gợi ý khách sạn
      const hotelServices = await this.suggestHotelServices(
        request,
        destinationCoords,
      );
      suggestions.push(...hotelServices);

      // 4. Gợi ý tour
      const tourServices = await this.suggestTourServices(
        request,
        destinationCoords,
        itinerary,
      );
      suggestions.push(...tourServices);
    } catch (error: unknown) {
      this.logger.error(
        'Error getting services from database, using mock data',
      );
      // Fallback mock services
      suggestions.push(...this.getMockServices(request, distanceFromHCM));
    }

    // Sắp xếp theo độ ưu tiên
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private async suggestVehicleServices(
    request: TravelRequest,
    distance: number,
  ): Promise<ServiceSuggestion[]> {
    try {
      // Vehicle service chỉ có trong bán kính 300km
      if (distance > this.SERVICE_RADIUS.VEHICLE) {
        return [];
      }

      const vehicles = await this.prisma.service.findMany({
        where: {
          type: 'VEHICLE',
          isActive: true,
        },
        include: {
          VehicleServiceDetail: true,
        },
        take: 5,
      });

      return vehicles.map((vehicle) => {
        const dailyRate =
          vehicle.VehicleServiceDetail?.pricePerDay?.toNumber() || 800000; // 800k/ngày mặc định
        const days = Math.ceil(
          (request.endDate.getTime() - request.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const totalCost = dailyRate * days;

        let priority = 8; // Ưu tiên cao cho thuê xe trong bán kính

        // Tăng ưu tiên nếu phù hợp với budget
        if (request.budget && totalCost <= request.budget * 0.3) {
          priority += 2;
        }

        return {
          serviceId: vehicle.id,
          serviceName: vehicle.name,
          serviceType: 'VEHICLE',
          price: totalCost,
          reason: `Thuê xe ${days} ngày, khoảng cách ${distance.toFixed(0)}km từ HCM (trong bán kính 300km)`,
          priority,
          available: true,
          distance,
        };
      });
    } catch (error: unknown) {
      return [];
    }
  }

  private async suggestFlightServices(
    request: TravelRequest,
    destinationCoords: { lat: number; lng: number },
  ): Promise<ServiceSuggestion[]> {
    try {
      const flights = await this.prisma.service.findMany({
        where: {
          type: 'FLIGHT',
          isActive: true,
        },
        include: {
          FlightServiceDetail: true,
        },
        take: 3,
      });

      return flights.map((flight) => {
        const flightPrice =
          flight.FlightServiceDetail?.basePrice?.toNumber() || 2000000; // 2M mặc định
        const totalCost = flightPrice * request.travelers;

        let priority = 6; // Ưu tiên trung bình cho máy bay

        // Tăng ưu tiên nếu khoảng cách xa
        const distance =
          Math.sqrt(
            Math.pow(destinationCoords.lat - this.HCM_COORDINATES.lat, 2) +
              Math.pow(destinationCoords.lng - this.HCM_COORDINATES.lng, 2),
          ) * 111; // Chuyển đổi thành km gần đúng

        if (distance > 500) {
          priority += 3;
        }

        return {
          serviceId: flight.id,
          serviceName: flight.name,
          serviceType: 'FLIGHT',
          price: totalCost,
          reason: `Vé máy bay cho ${request.travelers} người, tiết kiệm thời gian di chuyển`,
          priority,
          available: true,
          distance,
        };
      });
    } catch (error: unknown) {
      return [];
    }
  }

  private async suggestHotelServices(
    request: TravelRequest,
    destinationCoords: { lat: number; lng: number },
  ): Promise<ServiceSuggestion[]> {
    try {
      const hotels = await this.prisma.service.findMany({
        where: {
          type: 'HOTEL',
          isActive: true,
        },
        include: {
          HotelServiceDetail: true,
        },
        take: 5,
      });

      const days = Math.ceil(
        (request.endDate.getTime() - request.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return hotels.map((hotel) => {
        const roomRate =
          hotel.HotelServiceDetail?.basePrice?.toNumber() || 1500000; // 1.5M/đêm mặc định
        const totalCost = roomRate * days;

        let priority = 7; // Ưu tiên cao cho khách sạn

        // Tăng ưu tiên nếu phù hợp budget
        if (request.budget && totalCost <= request.budget * 0.4) {
          priority += 1;
        }

        // Tăng ưu tiên cho family trip
        if (request.travelType === 'family') {
          priority += 1;
        }

        return {
          serviceId: hotel.id,
          serviceName: hotel.name,
          serviceType: 'HOTEL',
          price: totalCost,
          reason: `Khách sạn ${days} đêm tại ${request.destination}`,
          priority,
          available: true,
        };
      });
    } catch (error: unknown) {
      return [];
    }
  }

  private async suggestTourServices(
    request: TravelRequest,
    destinationCoords: { lat: number; lng: number },
    itinerary: any,
  ): Promise<ServiceSuggestion[]> {
    try {
      const tours = await this.prisma.service.findMany({
        where: {
          type: 'TOUR',
          isActive: true,
        },
        include: {
          TourServiceDetail: true,
        },
        take: 3,
      });

      return tours.map((tour) => {
        const tourPrice =
          tour.TourServiceDetail?.adultPrice?.toNumber() || 2500000; // 2.5M mặc định
        const totalCost = tourPrice * request.travelers;

        let priority = 5; // Ưu tiên trung bình cho tour

        // Tăng ưu tiên nếu có preferences phù hợp
        if (
          request.preferences?.some(
            (pref) =>
              tour.name.toLowerCase().includes(pref.toLowerCase()) ||
              tour.description?.toLowerCase().includes(pref.toLowerCase()),
          )
        ) {
          priority += 2;
        }

        return {
          serviceId: tour.id,
          serviceName: tour.name,
          serviceType: 'TOUR',
          price: totalCost,
          reason: `Tour phù hợp với sở thích và lịch trình của bạn`,
          priority,
          available: true,
        };
      });
    } catch (error: unknown) {
      return [];
    }
  }

  private getMockServices(
    request: TravelRequest,
    distance: number,
  ): ServiceSuggestion[] {
    const services: ServiceSuggestion[] = [];
    const days = Math.ceil(
      (request.endDate.getTime() - request.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Vehicle service chỉ có nếu trong bán kính 300km
    if (distance <= this.SERVICE_RADIUS.VEHICLE) {
      services.push({
        serviceId: 'mock-vehicle-1',
        serviceName: 'Toyota Innova 7 chỗ',
        serviceType: 'VEHICLE',
        price: 800000 * days,
        reason: `Thuê xe ${days} ngày, khoảng cách ${distance.toFixed(0)}km từ HCM`,
        priority: 8,
        available: true,
        distance,
      });
    }

    // Flight service cho khoảng cách xa
    if (distance > 200) {
      services.push({
        serviceId: 'mock-flight-1',
        serviceName: 'Vé máy bay VietJet Air',
        serviceType: 'FLIGHT',
        price: 2000000 * request.travelers,
        reason: `Vé máy bay cho ${request.travelers} người, tiết kiệm thời gian`,
        priority: 7,
        available: true,
        distance,
      });
    }

    // Hotel service
    services.push({
      serviceId: 'mock-hotel-1',
      serviceName: 'Khách sạn 4 sao',
      serviceType: 'HOTEL',
      price: 1500000 * days,
      reason: `Khách sạn ${days} đêm tại ${request.destination}`,
      priority: 7,
      available: true,
    });

    // Tour service
    services.push({
      serviceId: 'mock-tour-1',
      serviceName: `Tour ${request.destination} ${days} ngày`,
      serviceType: 'TOUR',
      price: 2500000 * request.travelers,
      reason: 'Tour trọn gói phù hợp với lịch trình',
      priority: 6,
      available: true,
    });

    return services;
  }

  private calculateTotalCost(suggestions: ServiceSuggestion[]): number {
    // Lấy dịch vụ có ưu tiên cao nhất từ mỗi loại
    const bestServices = new Map<string, ServiceSuggestion>();

    for (const suggestion of suggestions) {
      const existing = bestServices.get(suggestion.serviceType);
      if (!existing || suggestion.priority > existing.priority) {
        bestServices.set(suggestion.serviceType, suggestion);
      }
    }

    return Array.from(bestServices.values()).reduce(
      (total, service) => total + service.price,
      0,
    );
  }

  private calculateFeasibilityScore(
    request: TravelRequest,
    suggestions: ServiceSuggestion[],
    distance: number,
  ): number {
    let score = 100;

    // Trừ điểm nếu vượt quá budget
    const totalCost = this.calculateTotalCost(suggestions);
    if (request.budget && totalCost > request.budget) {
      score -= Math.min(
        50,
        ((totalCost - request.budget) / request.budget) * 100,
      );
    }

    // Trừ điểm nếu khoảng cách quá xa cho thuê xe
    if (
      distance > this.SERVICE_RADIUS.VEHICLE &&
      !suggestions.some((s) => s.serviceType === 'FLIGHT')
    ) {
      score -= 30;
    }

    // Cộng điểm nếu có đủ dịch vụ cần thiết
    const serviceTypes = new Set(suggestions.map((s) => s.serviceType));
    if (serviceTypes.has('HOTEL')) score += 10;
    if (serviceTypes.has('VEHICLE') || serviceTypes.has('FLIGHT')) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  async getServiceRecommendations(
    destination: string,
    serviceType?: string,
  ): Promise<ServiceSuggestion[]> {
    try {
      const whereClause: any = {
        isActive: true,
      };

      if (serviceType) {
        whereClause.type = serviceType;
      }

      const services = await this.prisma.service.findMany({
        where: whereClause,
        include: {
          VehicleServiceDetail: true,
          FlightServiceDetail: true,
          HotelServiceDetail: true,
          TourServiceDetail: true,
          TransferServiceDetail: true,
          VisaServiceDetail: true,
          InsuranceServiceDetail: true,
        },
        take: 10,
      });

      return services.map((service) => {
        let price = 0;

        // Get price based on service type
        switch (service.type) {
          case 'VEHICLE':
            price = service.VehicleServiceDetail?.pricePerDay?.toNumber() || 0;
            break;
          case 'FLIGHT':
            price = service.FlightServiceDetail?.basePrice?.toNumber() || 0;
            break;
          case 'HOTEL':
            price = service.HotelServiceDetail?.basePrice?.toNumber() || 0;
            break;
          case 'TOUR':
            price = service.TourServiceDetail?.adultPrice?.toNumber() || 0;
            break;
          case 'TRANSFER':
            price = service.TransferServiceDetail?.basePrice?.toNumber() || 0;
            break;
          case 'VISA':
            price =
              (service.VisaServiceDetail?.processingFee?.toNumber() || 0) +
              (service.VisaServiceDetail?.serviceCharge?.toNumber() || 0);
            break;
          case 'INSURANCE':
            price =
              service.InsuranceServiceDetail?.premiumAmount?.toNumber() || 0;
            break;
          default:
            price = 0;
        }

        return {
          serviceId: service.id,
          serviceName: service.name,
          serviceType: service.type,
          price,
          reason: `Dịch vụ phù hợp cho chuyến đi ${destination}`,
          priority: 5,
          available: true,
        };
      });
    } catch (error: unknown) {
      // Fallback mock recommendations
      const mockServices = [
        {
          serviceId: 'mock-1',
          serviceName: 'Toyota Fortuner',
          serviceType: 'VEHICLE',
          price: 1200000,
          reason: `Xe sang phù hợp cho chuyến đi ${destination}`,
          priority: 7,
          available: true,
        },
        {
          serviceId: 'mock-2',
          serviceName: 'Vé máy bay Vietnam Airlines',
          serviceType: 'FLIGHT',
          price: 2500000,
          reason: `Bay thẳng đến ${destination}`,
          priority: 8,
          available: true,
        },
      ];

      if (serviceType) {
        return mockServices.filter((s) => s.serviceType === serviceType);
      }
      return mockServices;
    }
  }
}
