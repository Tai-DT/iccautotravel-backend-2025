import { Injectable } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { RecommendationService } from './recommendation.service';
import { ContentGeneratorService } from './content-generator.service';

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
}

export interface ChatMessage {
  message: string;
  userId?: string;
  language?: 'vi' | 'en' | 'ko';
  context?: any;
}

export interface RecommendationRequest {
  userId?: string;
  preferences?: any;
  budget?: number;
  travelDates?: {
    startDate: string;
    endDate: string;
  };
  location?: string;
  serviceType?: string;
}

@Injectable()
export class AIService {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly recommendationService: RecommendationService,
    private readonly contentGeneratorService: ContentGeneratorService,
  ) {}

  async processChat(chatMessage: ChatMessage): Promise<AIResponse> {
    try {
      const response = await this.chatbotService.processMessage(chatMessage);
      return {
        success: true,
        data: response,
        confidence: 0.85,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getRecommendations(
    request: RecommendationRequest,
  ): Promise<AIResponse> {
    try {
      const recommendations =
        await this.recommendationService.generateRecommendations(request);
      return {
        success: true,
        data: recommendations,
        confidence: 0.9,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateContent(type: string, data: any): Promise<AIResponse> {
    try {
      const content = await this.contentGeneratorService.generateContent(
        type,
        data,
      );
      return {
        success: true,
        data: content,
        confidence: 0.8,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async analyzeUserBehavior(userId: string): Promise<AIResponse> {
    try {
      // Mock AI analysis - in production, this would use ML models
      const analysis = {
        userSegment: 'premium_traveler',
        preferences: ['luxury_hotels', 'private_transfers', 'guided_tours'],
        priceRange: { min: 1000000, max: 5000000 },
        travelFrequency: 'frequent',
        preferredDestinations: ['Da Nang', 'Ho Chi Minh City', 'Hanoi'],
        bookingPatterns: {
          advanceBookingDays: 14,
          preferredBookingTime: 'evening',
          seasonalTrends: ['summer_beaches', 'winter_mountains'],
        },
      };

      return {
        success: true,
        data: analysis,
        confidence: 0.75,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async optimizePrice(serviceId: string, marketData: any): Promise<AIResponse> {
    try {
      // Mock price optimization - in production, this would use pricing algorithms
      const optimization = {
        currentPrice: marketData.currentPrice || 1000000,
        suggestedPrice: Math.round((marketData.currentPrice || 1000000) * 1.15),
        priceChange: 15,
        reasoning: 'High demand period detected, competitor prices increased',
        expectedImpact: {
          demandChange: -5,
          revenueChange: 10,
        },
        confidence: 0.82,
      };

      return {
        success: true,
        data: optimization,
        confidence: 0.82,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
