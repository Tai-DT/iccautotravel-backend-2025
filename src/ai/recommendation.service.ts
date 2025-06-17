import { Injectable } from '@nestjs/common';
import { RecommendationRequest } from './ai.service';

export interface RecommendationResult {
  services: ServiceRecommendation[];
  reasoning: string;
  confidence: number;
  alternatives?: ServiceRecommendation[];
}

export interface ServiceRecommendation {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  rating: number;
  features: string[];
  matchScore: number;
  reasons: string[];
  promotions?: string[];
}

@Injectable()
export class RecommendationService {
  private readonly mockServices = [
    {
      id: '1',
      name: 'Transfer sân bay Nội Bài - Hà Nội',
      type: 'TRANSFER',
      description: 'Dịch vụ đưa đón sân bay chuyên nghiệp, tài xế kinh nghiệm',
      price: 250000,
      rating: 4.8,
      features: [
        'Xe đời mới',
        'Tài xế chuyên nghiệp',
        'Đúng giờ',
        'Giá cố định',
      ],
      tags: ['hanoi', 'airport', 'transfer', 'professional'],
      location: 'Hà Nội',
      duration: '45 phút',
    },
    {
      id: '2',
      name: 'Tour Hạ Long 2N1Đ',
      type: 'TOUR',
      description: 'Tour du thuyền Hạ Long với ăn uống, nghỉ đêm trên thuyền',
      price: 1800000,
      rating: 4.9,
      features: [
        'Du thuyền 4 sao',
        'Bữa ăn hải sản',
        'Khám phá hang động',
        'Hướng dẫn viên',
      ],
      tags: ['halong', 'cruise', 'tour', 'premium', 'seafood'],
      location: 'Hạ Long',
      duration: '2 ngày 1 đêm',
    },
    {
      id: '3',
      name: 'Thuê xe Honda City 4 chỗ',
      type: 'VEHICLE',
      description: 'Xe Honda City mới, tự lái hoặc có tài xế',
      price: 800000,
      rating: 4.7,
      features: ['Xe đời 2023', 'Bảo hiểm toàn diện', 'GPS', 'Hỗ trợ 24/7'],
      tags: ['honda', 'rental', 'self-drive', 'city', 'compact'],
      location: 'Toàn quốc',
      duration: 'Theo ngày',
    },
    {
      id: '4',
      name: 'Khách sạn Sheraton Hà Nội',
      type: 'HOTEL',
      description: 'Khách sạn 5 sao trung tâm Hà Nội, view hồ Hoàn Kiếm',
      price: 3500000,
      rating: 4.6,
      features: ['5 sao', 'View hồ', 'Spa', 'Gym', 'Pool', 'Nhà hàng'],
      tags: ['luxury', 'hotel', 'hanoi', 'lake-view', '5-star'],
      location: 'Hà Nội',
      duration: 'Theo đêm',
    },
    {
      id: '5',
      name: 'Tour Sapa 3N2Đ',
      type: 'TOUR',
      description: 'Trek Sapa, thăm bản Cát Cát, nghỉ homestay',
      price: 2200000,
      rating: 4.8,
      features: ['Trekking', 'Homestay', 'Văn hóa địa phương', 'Cảnh núi non'],
      tags: ['sapa', 'trekking', 'mountain', 'culture', 'homestay'],
      location: 'Sapa',
      duration: '3 ngày 2 đêm',
    },
  ];

  async generateRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResult> {
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    const {
      userId,
      preferences = {},
      budget,
      travelDates,
      location,
      serviceType,
    } = request;

    // Filter services based on criteria
    let filteredServices = this.mockServices;

    if (serviceType) {
      filteredServices = filteredServices.filter(
        (s) => s.type === serviceType.toUpperCase(),
      );
    }

    if (budget) {
      filteredServices = filteredServices.filter((s) => s.price <= budget);
    }

    if (location) {
      filteredServices = filteredServices.filter(
        (s) =>
          s.location.toLowerCase().includes(location.toLowerCase()) ||
          s.tags.some((tag) => tag.includes(location.toLowerCase())),
      );
    }

    // Calculate match scores based on preferences
    const recommendations = filteredServices.map((service) => {
      const matchScore = this.calculateMatchScore(service, request);
      const reasons = this.generateReasons(service, request);

      return {
        id: service.id,
        name: service.name,
        type: service.type,
        description: service.description,
        price: service.price,
        rating: service.rating,
        features: service.features,
        matchScore,
        reasons,
        promotions: this.generatePromotions(service),
      };
    });

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Take top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3);
    const alternatives = recommendations.slice(3, 6);

    return {
      services: topRecommendations,
      reasoning: this.generateReasoningText(request, topRecommendations),
      confidence: this.calculateConfidence(topRecommendations),
      alternatives,
    };
  }

  private calculateMatchScore(
    service: any,
    request: RecommendationRequest,
  ): number {
    let score = 70; // Base score

    // Budget matching
    if (request.budget) {
      if (service.price <= request.budget * 0.8) score += 20;
      else if (service.price <= request.budget) score += 10;
      else score -= 20;
    }

    // Location matching
    if (request.location) {
      if (
        service.location.toLowerCase().includes(request.location.toLowerCase())
      ) {
        score += 25;
      }
    }

    // Service type matching
    if (
      request.serviceType &&
      service.type === request.serviceType.toUpperCase()
    ) {
      score += 30;
    }

    // Rating bonus
    score += (service.rating - 4.0) * 10;

    // Random factor for variety
    score += Math.random() * 10 - 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateReasons(
    service: any,
    request: RecommendationRequest,
  ): string[] {
    const reasons = [];

    if (service.rating >= 4.5) {
      reasons.push(`Đánh giá cao (${service.rating}/5)`);
    }

    if (request.budget && service.price <= request.budget * 0.8) {
      reasons.push('Phù hợp ngân sách');
    }

    if (
      request.location &&
      service.location.toLowerCase().includes(request.location.toLowerCase())
    ) {
      reasons.push(`Tại ${request.location}`);
    }

    if (service.features.length >= 4) {
      reasons.push('Nhiều tiện ích');
    }

    if (
      service.type === 'TOUR' &&
      service.features.includes('Hướng dẫn viên')
    ) {
      reasons.push('Có hướng dẫn viên chuyên nghiệp');
    }

    if (service.type === 'TRANSFER' && service.features.includes('Đúng giờ')) {
      reasons.push('Cam kết đúng giờ');
    }

    return reasons.slice(0, 3);
  }

  private generatePromotions(service: any): string[] {
    const promotions = [];

    // Random promotion generation
    if (Math.random() > 0.7) {
      promotions.push('Giảm 10% cho khách hàng mới');
    }

    if (service.type === 'TOUR' && Math.random() > 0.6) {
      promotions.push('Miễn phí bảo hiểm du lịch');
    }

    if (service.type === 'VEHICLE' && Math.random() > 0.5) {
      promotions.push('Miễn phí giao xe tận nơi');
    }

    if (service.type === 'HOTEL' && Math.random() > 0.8) {
      promotions.push('Upgrade phòng miễn phí (tùy tình trạng)');
    }

    return promotions;
  }

  private generateReasoningText(
    request: RecommendationRequest,
    recommendations: ServiceRecommendation[],
  ): string {
    const { budget, location, serviceType } = request;

    let reasoning = 'Dựa trên yêu cầu của bạn, tôi đề xuất những dịch vụ sau: ';

    if (budget) {
      reasoning += `trong ngân sách ${budget.toLocaleString('vi-VN')} VND, `;
    }

    if (location) {
      reasoning += `tại khu vực ${location}, `;
    }

    if (serviceType) {
      reasoning += `loại dịch vụ ${serviceType}, `;
    }

    reasoning += `với các tiêu chí: đánh giá cao, giá cả hợp lý, và chất lượng dịch vụ tốt.`;

    if (recommendations.length > 0) {
      const topRec = recommendations[0];
      reasoning += ` Tôi đặc biệt recommend "${topRec.name}" với điểm phù hợp ${topRec.matchScore.toFixed(0)}/100.`;
    }

    return reasoning;
  }

  private calculateConfidence(
    recommendations: ServiceRecommendation[],
  ): number {
    if (recommendations.length === 0) return 0;

    const avgScore =
      recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) /
      recommendations.length;
    return Math.round(avgScore) / 100;
  }

  // Additional methods for specific recommendation types
  async getComboRecommendations(
    serviceId: string,
  ): Promise<ServiceRecommendation[]> {
    // Mock combo recommendations based on selected service
    const comboMappings = {
      '1': ['4', '2'], // Transfer -> Hotel + Tour
      '2': ['1', '3'], // Tour -> Transfer + Vehicle
      '3': ['4'], // Vehicle -> Hotel
      '4': ['1'], // Hotel -> Transfer
    };

    const comboIds =
      comboMappings[serviceId as keyof typeof comboMappings] || [];
    return this.mockServices
      .filter((s) => comboIds.includes(s.id))
      .map((service) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        description: service.description,
        price: service.price * 0.9, // 10% combo discount
        rating: service.rating,
        features: service.features,
        matchScore: 85,
        reasons: ['Combo tiết kiệm', 'Dịch vụ liên quan'],
        promotions: ['Giảm 10% khi đặt combo'],
      }));
  }

  async getTrendingServices(): Promise<ServiceRecommendation[]> {
    // Mock trending services
    return this.mockServices
      .filter((s) => s.rating >= 4.7)
      .slice(0, 3)
      .map((service) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        description: service.description,
        price: service.price,
        rating: service.rating,
        features: service.features,
        matchScore: 90,
        reasons: ['Trending', 'Đánh giá cao', 'Được ưa chuộng'],
        promotions: ['Hot deal của tuần'],
      }));
  }
}
