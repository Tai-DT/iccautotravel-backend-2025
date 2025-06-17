import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceType } from '@prisma/client';

export interface PricingRule {
  id: string;
  name: string;
  serviceType: ServiceType;
  condition: PricingCondition;
  adjustment: PricingAdjustment;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface PricingCondition {
  type:
    | 'seasonal'
    | 'demand'
    | 'duration'
    | 'advance_booking'
    | 'group_size'
    | 'day_of_week'
    | 'location';
  operator:
    | 'equals'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'in'
    | 'not_in';
  value: any;
  metadata?: any;
}

export interface PricingAdjustment {
  type: 'percentage' | 'fixed_amount' | 'replace';
  value: number;
  currency?: string;
  roundingRule?: 'none' | 'round' | 'floor' | 'ceil';
}

export interface PricingContext {
  serviceId: string;
  serviceType: ServiceType;
  basePrice: number;
  currency: string;
  bookingDate: Date;
  serviceDate: Date;
  duration?: number;
  groupSize?: number;
  location?: string;
  seasonalFactors?: {
    isHoliday: boolean;
    isPeakSeason: boolean;
    isWeekend: boolean;
  };
  demandFactors?: {
    currentBookings: number;
    availableSlots: number;
    popularityScore: number;
  };
}

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  currency: string;
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    adjustment: PricingAdjustment;
    priceAfterRule: number;
  }>;
  breakdown: {
    basePrice: number;
    discounts: number;
    surcharges: number;
    taxes: number;
    total: number;
  };
  validUntil?: Date;
}

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateDynamicPrice(context: PricingContext): Promise<PricingResult> {
    try {
      this.logger.log(
        `Calculating dynamic price for service ${context.serviceId}`,
      );

      // Get applicable pricing rules
      const rules = await this.getApplicablePricingRules(context);

      // Sort rules by priority
      rules.sort((a, b) => a.priority - b.priority);

      let currentPrice = context.basePrice;
      const appliedRules: PricingResult['appliedRules'] = [];
      let totalDiscounts = 0;
      let totalSurcharges = 0;

      // Apply each rule
      for (const rule of rules) {
        if (this.evaluateCondition(rule.condition, context)) {
          const previousPrice = currentPrice;
          currentPrice = this.applyAdjustment(currentPrice, rule.adjustment);

          const adjustment = currentPrice - previousPrice;
          if (adjustment < 0) {
            totalDiscounts += Math.abs(adjustment);
          } else {
            totalSurcharges += adjustment;
          }

          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            adjustment: rule.adjustment,
            priceAfterRule: currentPrice,
          });

          this.logger.debug(
            `Applied rule ${rule.name}: ${previousPrice} -> ${currentPrice}`,
          );
        }
      }

      // Calculate taxes (example: 10% VAT)
      const taxes = currentPrice * 0.1;
      const finalPrice = currentPrice + taxes;

      // Round final price
      const roundedFinalPrice = Math.round(finalPrice);

      return {
        originalPrice: context.basePrice,
        finalPrice: roundedFinalPrice,
        currency: context.currency,
        appliedRules,
        breakdown: {
          basePrice: context.basePrice,
          discounts: totalDiscounts,
          surcharges: totalSurcharges,
          taxes,
          total: roundedFinalPrice,
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate dynamic price for service ${context.serviceId}:`,
        error,
      );

      // Return original price if calculation fails
      return {
        originalPrice: context.basePrice,
        finalPrice: context.basePrice,
        currency: context.currency,
        appliedRules: [],
        breakdown: {
          basePrice: context.basePrice,
          discounts: 0,
          surcharges: 0,
          taxes: 0,
          total: context.basePrice,
        },
      };
    }
  }

  async createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<PricingRule> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, save to database
    // For now, return the rule with generated ID
    return {
      id: ruleId,
      ...rule,
    };
  }

  async updatePricingRule(
    ruleId: string,
    updates: Partial<PricingRule>,
  ): Promise<PricingRule> {
    // In a real implementation, update in database
    throw new Error('Not implemented');
  }

  async deletePricingRule(ruleId: string): Promise<void> {
    // In a real implementation, delete from database
    throw new Error('Not implemented');
  }

  async getDefaultPricingRules(): Promise<PricingRule[]> {
    return [
      // Seasonal pricing
      {
        id: 'seasonal_peak',
        name: 'Peak Season Surcharge',
        serviceType: ServiceType.TOUR,
        condition: {
          type: 'seasonal',
          operator: 'in',
          value: ['summer', 'new_year', 'tet_holiday'],
        },
        adjustment: {
          type: 'percentage',
          value: 25, // 25% increase
        },
        priority: 1,
        isActive: true,
      },

      // Early bird discount
      {
        id: 'early_bird',
        name: 'Early Bird Discount',
        serviceType: ServiceType.TOUR,
        condition: {
          type: 'advance_booking',
          operator: 'greater_than',
          value: 30, // 30 days in advance
        },
        adjustment: {
          type: 'percentage',
          value: -15, // 15% discount
        },
        priority: 2,
        isActive: true,
      },

      // Group discount
      {
        id: 'group_discount',
        name: 'Group Discount',
        serviceType: ServiceType.TOUR,
        condition: {
          type: 'group_size',
          operator: 'greater_than',
          value: 5,
        },
        adjustment: {
          type: 'percentage',
          value: -10, // 10% discount for groups > 5
        },
        priority: 3,
        isActive: true,
      },

      // Weekend surcharge for vehicles
      {
        id: 'weekend_vehicle',
        name: 'Weekend Vehicle Surcharge',
        serviceType: ServiceType.VEHICLE,
        condition: {
          type: 'day_of_week',
          operator: 'in',
          value: ['friday', 'saturday', 'sunday'],
        },
        adjustment: {
          type: 'percentage',
          value: 20, // 20% increase on weekends
        },
        priority: 1,
        isActive: true,
      },

      // High demand pricing
      {
        id: 'high_demand',
        name: 'High Demand Surcharge',
        serviceType: ServiceType.HOTEL,
        condition: {
          type: 'demand',
          operator: 'greater_than',
          value: 0.8, // 80% occupancy
          metadata: { metric: 'occupancy_rate' },
        },
        adjustment: {
          type: 'percentage',
          value: 30, // 30% increase when high demand
        },
        priority: 1,
        isActive: true,
      },

      // Long stay discount for hotels
      {
        id: 'long_stay_hotel',
        name: 'Long Stay Discount',
        serviceType: ServiceType.HOTEL,
        condition: {
          type: 'duration',
          operator: 'greater_than',
          value: 7, // More than 7 nights
        },
        adjustment: {
          type: 'percentage',
          value: -12, // 12% discount for long stays
        },
        priority: 2,
        isActive: true,
      },
    ];
  }

  private async getApplicablePricingRules(
    context: PricingContext,
  ): Promise<PricingRule[]> {
    // In a real implementation, query database
    // For now, return default rules filtered by service type
    const allRules = await this.getDefaultPricingRules();

    return allRules.filter(
      (rule) =>
        rule.serviceType === context.serviceType &&
        rule.isActive &&
        this.isRuleValidForDate(rule, context.bookingDate),
    );
  }

  private isRuleValidForDate(rule: PricingRule, date: Date): boolean {
    if (rule.validFrom && date < rule.validFrom) return false;
    if (rule.validTo && date > rule.validTo) return false;
    return true;
  }

  private evaluateCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    switch (condition.type) {
      case 'seasonal':
        return this.evaluateSeasonalCondition(condition, context);
      case 'advance_booking':
        return this.evaluateAdvanceBookingCondition(condition, context);
      case 'group_size':
        return this.evaluateGroupSizeCondition(condition, context);
      case 'day_of_week':
        return this.evaluateDayOfWeekCondition(condition, context);
      case 'demand':
        return this.evaluateDemandCondition(condition, context);
      case 'duration':
        return this.evaluateDurationCondition(condition, context);
      case 'location':
        return this.evaluateLocationCondition(condition, context);
      default:
        return false;
    }
  }

  private evaluateSeasonalCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    const currentSeason = this.getCurrentSeason(context.serviceDate);

    switch (condition.operator) {
      case 'equals':
        return currentSeason === condition.value;
      case 'in':
        return condition.value.includes(currentSeason);
      case 'not_in':
        return !condition.value.includes(currentSeason);
      default:
        return false;
    }
  }

  private evaluateAdvanceBookingCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    const daysDifference = Math.floor(
      (context.serviceDate.getTime() - context.bookingDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return this.evaluateNumericCondition(condition, daysDifference);
  }

  private evaluateGroupSizeCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    if (!context.groupSize) return false;
    return this.evaluateNumericCondition(condition, context.groupSize);
  }

  private evaluateDayOfWeekCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    const dayOfWeek = context.serviceDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    switch (condition.operator) {
      case 'equals':
        return dayOfWeek === condition.value;
      case 'in':
        return condition.value.includes(dayOfWeek);
      case 'not_in':
        return !condition.value.includes(dayOfWeek);
      default:
        return false;
    }
  }

  private evaluateDemandCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    if (!context.demandFactors) return false;

    let demandValue: number;
    const metric = condition.metadata?.metric || 'occupancy_rate';

    switch (metric) {
      case 'occupancy_rate':
        demandValue =
          context.demandFactors.currentBookings /
          (context.demandFactors.availableSlots || 1);
        break;
      case 'popularity_score':
        demandValue = context.demandFactors.popularityScore;
        break;
      default:
        return false;
    }

    return this.evaluateNumericCondition(condition, demandValue);
  }

  private evaluateDurationCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    if (!context.duration) return false;
    return this.evaluateNumericCondition(condition, context.duration);
  }

  private evaluateLocationCondition(
    condition: PricingCondition,
    context: PricingContext,
  ): boolean {
    if (!context.location) return false;

    switch (condition.operator) {
      case 'equals':
        return context.location === condition.value;
      case 'in':
        return condition.value.includes(context.location);
      case 'not_in':
        return !condition.value.includes(context.location);
      default:
        return false;
    }
  }

  private evaluateNumericCondition(
    condition: PricingCondition,
    value: number,
  ): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1];
      default:
        return false;
    }
  }

  private applyAdjustment(
    basePrice: number,
    adjustment: PricingAdjustment,
  ): number {
    let newPrice: number;

    switch (adjustment.type) {
      case 'percentage':
        newPrice = basePrice * (1 + adjustment.value / 100);
        break;
      case 'fixed_amount':
        newPrice = basePrice + adjustment.value;
        break;
      case 'replace':
        newPrice = adjustment.value;
        break;
      default:
        newPrice = basePrice;
    }

    // Apply rounding rule
    switch (adjustment.roundingRule) {
      case 'round':
        return Math.round(newPrice);
      case 'floor':
        return Math.floor(newPrice);
      case 'ceil':
        return Math.ceil(newPrice);
      default:
        return newPrice;
    }
  }

  private getCurrentSeason(date: Date): string {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Vietnamese seasons and holidays
    if ((month === 12 && day >= 20) || month <= 2) {
      return 'winter';
    } else if (month >= 3 && month <= 5) {
      return 'spring';
    } else if (month >= 6 && month <= 8) {
      return 'summer';
    } else {
      return 'autumn';
    }

    // Check for holidays
    if (this.isTetHoliday(date)) {
      return 'tet_holiday';
    }
    if (this.isNewYearPeriod(date)) {
      return 'new_year';
    }

    return 'regular';
  }

  private isTetHoliday(date: Date): boolean {
    // Simplified Tet holiday check (usually late January to mid February)
    const month = date.getMonth() + 1;
    return (
      (month === 1 && date.getDate() >= 20) ||
      (month === 2 && date.getDate() <= 15)
    );
  }

  private isNewYearPeriod(date: Date): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return (month === 12 && day >= 25) || (month === 1 && day <= 5);
  }
}
