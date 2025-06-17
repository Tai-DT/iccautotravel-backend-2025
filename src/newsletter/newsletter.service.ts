import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { v4 as uuidv4 } from 'uuid';
import { NewsletterStatus } from '@prisma/client';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async subscribe(createNewsletterDto: CreateNewsletterDto) {
    // Check if email already exists
    const existing = await this.prisma.newsletter.findUnique({
      where: { email: createNewsletterDto.email },
    });

    if (existing) {
      if (existing.status === NewsletterStatus.ACTIVE) {
        throw new ConflictException('Email is already subscribed');
      } else {
        // Reactivate subscription
        const updated = await this.prisma.newsletter.update({
          where: { email: createNewsletterDto.email },
          data: {
            status: NewsletterStatus.ACTIVE,
            preferences: createNewsletterDto.preferences,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        });

        this.logger.log(
          `Reactivated newsletter subscription for ${createNewsletterDto.email}`,
        );
        return updated;
      }
    }

    const subscription = await this.prisma.newsletter.create({
      data: {
        id: uuidv4(),
        ...createNewsletterDto,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `New newsletter subscription: ${createNewsletterDto.email}`,
    );

    // TODO: Send welcome email
    // TODO: Add to email marketing service

    return subscription;
  }

  async unsubscribe(email: string) {
    const subscription = await this.prisma.newsletter.findUnique({
      where: { email },
    });

    if (!subscription) {
      throw new NotFoundException('Email not found in newsletter list');
    }

    if (subscription.status === NewsletterStatus.UNSUBSCRIBED) {
      return { message: 'Email is already unsubscribed' };
    }

    await this.prisma.newsletter.update({
      where: { email },
      data: {
        status: NewsletterStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });

    this.logger.log(`Newsletter unsubscribed: ${email}`);

    // TODO: Remove from email marketing service
    // TODO: Send confirmation email

    return { message: 'Successfully unsubscribed from newsletter' };
  }

  async findAll(
    filters: {
      status?: NewsletterStatus;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { page = 1, limit = 10, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.newsletter.findMany({
        where: whereFilters,
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.newsletter.count({ where: whereFilters }),
    ]);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(email: string) {
    const subscription = await this.prisma.newsletter.findUnique({
      where: { email },
    });

    if (!subscription) {
      throw new NotFoundException('Newsletter subscription not found');
    }

    return subscription;
  }

  async updatePreferences(email: string, updateDto: UpdateNewsletterDto) {
    await this.findOne(email); // Check if exists

    return this.prisma.newsletter.update({
      where: { email },
      data: updateDto,
    });
  }

  async getStatistics() {
    const [total, active, unsubscribed] = await Promise.all([
      this.prisma.newsletter.count(),
      this.prisma.newsletter.count({
        where: { status: NewsletterStatus.ACTIVE },
      }),
      this.prisma.newsletter.count({
        where: { status: NewsletterStatus.UNSUBSCRIBED },
      }),
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentSubscriptions = await this.prisma.newsletter.count({
      where: {
        subscribedAt: { gte: last30Days },
        status: NewsletterStatus.ACTIVE,
      },
    });

    return {
      total,
      active,
      unsubscribed,
      subscriptionRate: total > 0 ? (active / total) * 100 : 0,
      recentSubscriptions,
    };
  }

  // Get active subscribers for email campaigns
  async getActiveSubscribers(preferences?: {
    languages?: string[];
    topics?: string[];
  }) {
    const where: any = {
      status: NewsletterStatus.ACTIVE,
    };

    if (preferences?.languages || preferences?.topics) {
      where.AND = [];

      if (preferences.languages) {
        where.AND.push({
          preferences: {
            path: ['languages'],
            array_contains: preferences.languages,
          },
        });
      }

      if (preferences.topics) {
        where.AND.push({
          preferences: {
            path: ['topics'],
            array_contains: preferences.topics,
          },
        });
      }
    }

    return this.prisma.newsletter.findMany({
      where,
      select: {
        email: true,
        preferences: true,
      },
    });
  }
}
