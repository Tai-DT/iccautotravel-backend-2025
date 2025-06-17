import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { RedisService } from '../redis/redis.service';
import { FAQ, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);
  private readonly CACHE_KEY_PREFIX = 'faq';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(createFaqDto: CreateFaqDto, userId?: string): Promise<FAQ> {
    const baseData: any = {
      id: uuidv4(),
      ...createFaqDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (userId) {
      this.logger.log(`FAQ created by user ${userId}`);
    }

    if (createFaqDto.audioFileMaleId) {
      baseData.audioFileMaleId = createFaqDto.audioFileMaleId;
    }
    if (createFaqDto.audioFileFemaleId) {
      baseData.audioFileFemaleId = createFaqDto.audioFileFemaleId;
    }

    const data = baseData as Prisma.FAQCreateInput;

    const newFaq = await this.prisma.fAQ.create({
      data,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        lang: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sortOrder: true,
        audioFileMaleId: true,
        audioFileFemaleId: true,
      },
    });

    await this.clearCache();
    return newFaq;
  }

  async findAll(
    params: { lang?: string; category?: string; isActive?: boolean } = {},
  ) {
    const { lang, category, isActive } = params;
    const cacheKey = `${this.CACHE_KEY_PREFIX}:all:${lang || 'all'}:${category || 'all'}:${isActive === undefined ? 'all' : isActive}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.FAQWhereInput = {};

    if (lang) {
      where.lang = lang;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const faqs = await this.prisma.fAQ.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(faqs), 3600);
    return faqs;
  }

  async findCategories(lang?: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:categories:${lang || 'all'}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.FAQWhereInput = { isActive: true };

    if (lang) {
      where.lang = lang;
    }

    const result = await this.prisma.fAQ.groupBy({
      by: ['category'],
      where,
      _count: { category: true },
      orderBy: { category: 'asc' },
    });

    const categories = result.map((item) => ({
      name: item.category,
      count: item._count.category,
    }));

    await this.redisService.set(cacheKey, JSON.stringify(categories), 3600);
    return categories;
  }

  async findByCategory(category: string, lang?: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:category:${category}:${lang || 'all'}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.FAQWhereInput = {
      category,
      isActive: true,
    };

    if (lang) {
      where.lang = lang;
    }

    const faqs = await this.prisma.fAQ.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    await this.redisService.set(cacheKey, JSON.stringify(faqs), 3600);
    return faqs;
  }

  async findOne(id: string): Promise<FAQ> {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        lang: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sortOrder: true,
        audioFileMaleId: true,
        audioFileFemaleId: true,
      },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async update(
    id: string,
    updateFaqDto: UpdateFaqDto,
    userId?: string,
  ): Promise<FAQ> {
    await this.findOne(id);

    // Optional audit tracking with userId
    if (userId) {
      this.logger.log(`FAQ ${id} updated by user ${userId}`);
      // You could store this in an audit field if needed
    }

    const { audioFileMaleId, audioFileFemaleId, ...restData } = updateFaqDto;

    const data: any = {
      ...restData,
      updatedAt: new Date(),
    };

    if (audioFileMaleId === null) {
      data.audioFileMaleId = null;
    } else if (audioFileMaleId) {
      data.audioFileMaleId = audioFileMaleId;
    }

    if (audioFileFemaleId === null) {
      data.audioFileFemaleId = null;
    } else if (audioFileFemaleId) {
      data.audioFileFemaleId = audioFileFemaleId;
    }

    const updatedFaq = await this.prisma.fAQ.update({
      where: { id },
      data,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        lang: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sortOrder: true,
        audioFileMaleId: true,
        audioFileFemaleId: true,
      },
    });

    await this.clearFaqCache(updatedFaq);
    return updatedFaq;
  }

  async remove(id: string): Promise<FAQ> {
    const faq = await this.findOne(id);

    const deletedFaq = await this.prisma.fAQ.delete({
      where: { id },
    });

    await this.clearCache();
    return deletedFaq;
  }

  async reorder(ids: string[]): Promise<boolean> {
    // Validate that all IDs exist
    for (let i = 0; i < ids.length; i++) {
      const faqExists = await this.prisma.fAQ.findUnique({
        where: { id: ids[i] },
        select: { id: true },
      });

      if (!faqExists) {
        throw new NotFoundException(`FAQ with ID ${ids[i]} not found`);
      }
    }

    // Update sort order in a transaction
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.fAQ.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await this.clearCache();
    return true;
  }

  private async clearFaqCache(faq: FAQ): Promise<void> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:${faq.id}`;
    await this.redisService.del(cacheKey);
  }

  private async clearCache(): Promise<void> {
    await this.redisService.flushAll();
  }
}
