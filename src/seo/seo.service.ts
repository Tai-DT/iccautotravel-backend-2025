import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { CreateSEOConfigDto } from './dto/create-seo-config.dto';
import { UpdateSEOConfigDto } from './dto/update-seo-config.dto';
import { UpsertSEOConfigDto } from './dto/upsert-seo-config.dto';
import { SEOConfigFilterDto } from './dto/seo-config-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client'; // Keep Prisma for types
import { SEOConfigEntity } from './entities/seo-config.entity';
import { DatabaseException } from '../common/exceptions/database.exception';

@Injectable()
export class SEOService {
  private readonly logger = new Logger(SEOService.name);

  constructor(private readonly prismaService: PrismaService) {
    this.logger.log(
      `SEOService instantiated with PrismaService. Checking for this.prismaService.sEOConfig...`,
    );
    if (this.prismaService.sEOConfig) {
      this.logger.log(
        `this.prismaService.sEOConfig is available. Type: ${typeof this.prismaService.sEOConfig}`,
      );
    } else {
      this.logger.error('CRITICAL: this.prismaService.sEOConfig is UNDEFINED.');
    }
  }

  async createSEOConfig(
    createSEOConfigDto: CreateSEOConfigDto,
  ): Promise<SEOConfigEntity> {
    try {
      const pageUrl = createSEOConfigDto.pageUrl || createSEOConfigDto.page;
      const lang = createSEOConfigDto.lang || 'vi';

      const existing = await this.prismaService.sEOConfig.findFirst({
        where: {
          page: pageUrl, // Use page field instead of pageUrl or path
          lang,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `SEO Config already exists for page ${pageUrl} in language ${lang}`,
        );
      }

      const data: Prisma.SEOConfigCreateInput = {
        id: uuidv4(),
        page: pageUrl, // Use 'page' instead of 'pageUrl' to match the schema
        title: createSEOConfigDto.title,
        description: createSEOConfigDto.description,
        keywords: Array.isArray(createSEOConfigDto.keywords)
          ? createSEOConfigDto.keywords
          : createSEOConfigDto.keywords &&
              typeof createSEOConfigDto.keywords === 'string'
            ? (createSEOConfigDto.keywords as string)
                .split(',')
                .map((k: string) => k.trim())
            : [],
        ogTitle: createSEOConfigDto.ogTitle,
        ogDescription: createSEOConfigDto.ogDescription,
        ogImage: createSEOConfigDto.ogImage,
        canonicalUrl: createSEOConfigDto.canonicalUrl,
        isActive: createSEOConfigDto.noIndex ? false : true, // Map noIndex to isActive (inverted logic)
        lang: lang,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const seoConfig = await this.prismaService.sEOConfig.create({
        data,
      });

      return SEOConfigEntity.fromPrisma(seoConfig);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error creating SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllSEOConfigs(
    filters: SEOConfigFilterDto = {},
  ): Promise<SEOConfigEntity[]> {
    try {
      const where: Prisma.SEOConfigWhereInput = {};

      if (filters.page) {
        where.page = filters.page;
      }

      if (filters.lang) {
        where.lang = filters.lang;
      }

      if (filters.search) {
        where.OR = [
          { page: { contains: filters.search, mode: 'insensitive' } },
          { title: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const orderBy: Prisma.SEOConfigOrderByWithRelationInput[] = [
        { page: 'asc' },
        { lang: 'asc' },
        { createdAt: 'desc' },
      ];

      const seoConfigs = await this.prismaService.sEOConfig.findMany({
        where,
        orderBy,
      });

      return seoConfigs.map((config) => SEOConfigEntity.fromPrisma(config));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error finding SEO configs: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOneSEOConfig(
    pageUrl: string,
    lang: string = 'vi',
  ): Promise<SEOConfigEntity> {
    try {
      const config = await this.prismaService.sEOConfig.findFirst({
        where: { page: pageUrl, lang }, // Use page instead of pageUrl
      });

      if (!config) {
        throw new NotFoundException(
          `SEO Config not found for page ${pageUrl} in language ${lang}`,
        );
      }

      return SEOConfigEntity.fromPrisma(config);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error finding SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateSEOConfig(
    id: string,
    updateSEOConfigDto: UpdateSEOConfigDto,
  ): Promise<SEOConfigEntity> {
    try {
      const existingSEOConfig = await this.prismaService.sEOConfig.findUnique({
        where: { id },
      });

      if (!existingSEOConfig) {
        throw new NotFoundException(`SEO Config with ID ${id} not found`);
      }

      // Process keywords properly according to schema
      let processedKeywords;
      if (updateSEOConfigDto.keywords) {
        if (Array.isArray(updateSEOConfigDto.keywords)) {
          processedKeywords = updateSEOConfigDto.keywords;
        } else if (typeof updateSEOConfigDto.keywords === 'string') {
          processedKeywords = (updateSEOConfigDto.keywords as string)
            .split(',')
            .map((k: string) => k.trim());
        }
      }

      const updatedData: any = { ...updateSEOConfigDto };

      updatedData.lastModified = new Date();
      updatedData.updatedAt = new Date();

      const updatedSEOConfig = await this.prismaService.sEOConfig.update({
        where: { id },
        data: {
          ...updateSEOConfigDto,
          keywords: processedKeywords,
          updatedAt: new Date(),
        },
      });

      return SEOConfigEntity.fromPrisma(updatedSEOConfig);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error updating SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findSEOConfigsByLang(lang: string = 'vi'): Promise<SEOConfigEntity[]> {
    try {
      const where: Prisma.SEOConfigWhereInput = {
        lang,
      };

      const seoConfigs = await this.prismaService.sEOConfig.findMany({
        where,
        orderBy: [{ page: 'asc' }, { createdAt: 'desc' }], // Use page instead of pageUrl
      });

      return seoConfigs.map((config) => SEOConfigEntity.fromPrisma(config));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error finding SEO configs by language: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async upsertSEOConfig(
    pageUrl: string,
    lang: string,
    seoData: UpsertSEOConfigDto,
  ): Promise<SEOConfigEntity> {
    try {
      const existingConfig = await this.prismaService.sEOConfig.findFirst({
        where: { page: pageUrl, lang }, // Use page instead of pageUrl
      });

      const convertedData = { ...seoData };
      // No need to convert keywords, keep it as an array

      if (existingConfig) {
        return this.updateSEOConfig(existingConfig.id, convertedData);
      } else {
        return this.createSEOConfig({
          ...convertedData,
          pageUrl,
          lang,
        } as CreateSEOConfigDto);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseException(
        `Error upserting SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Alias methods to match controller expectations

  // Alias for createSEOConfig
  async create(
    createSEOConfigDto: CreateSEOConfigDto,
  ): Promise<SEOConfigEntity> {
    return this.createSEOConfig(createSEOConfigDto);
  }

  // Alias for findAllSEOConfigs
  async findAll(filters?: SEOConfigFilterDto): Promise<SEOConfigEntity[]> {
    try {
      const where = this.buildWhereClause(filters);

      const configs = await this.prismaService.sEOConfig.findMany({
        where,
        orderBy: { page: 'asc' },
      });

      return configs.map((config) => SEOConfigEntity.fromPrisma(config));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findAll: ${errorMessage}`, errorStack);
      throw new DatabaseException(
        `Failed to retrieve SEO configs: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Alias for findSEOConfigById
  async findOne(id: string): Promise<SEOConfigEntity> {
    try {
      const config = await this.prismaService.sEOConfig.findUnique({
        where: { id },
      });

      if (!config) {
        throw new NotFoundException(`SEO config with ID ${id} not found`);
      }

      return SEOConfigEntity.fromPrisma(config);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findOne: ${errorMessage}`, errorStack);
      throw new DatabaseException(
        `Failed to retrieve SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Alias for updateSEOConfig
  async update(
    id: string,
    updateSEOConfigDto: UpdateSEOConfigDto,
  ): Promise<SEOConfigEntity> {
    try {
      // Check if the SEO config exists
      const existingConfig = await this.prismaService.sEOConfig.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        throw new NotFoundException(`SEO config with ID ${id} not found`);
      }

      // Process keywords properly according to schema
      let processedKeywords;
      if (updateSEOConfigDto.keywords) {
        if (Array.isArray(updateSEOConfigDto.keywords)) {
          processedKeywords = updateSEOConfigDto.keywords;
        } else if (typeof updateSEOConfigDto.keywords === 'string') {
          processedKeywords = (updateSEOConfigDto.keywords as string)
            .split(',')
            .map((k) => k.trim());
        }
      }

      // Update the SEO config
      const updatedConfig = await this.prismaService.sEOConfig.update({
        where: { id },
        data: {
          ...updateSEOConfigDto,
          keywords: processedKeywords,
          updatedAt: new Date(),
        },
      });

      return SEOConfigEntity.fromPrisma(updatedConfig);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in update: ${errorMessage}`, errorStack);
      throw new DatabaseException(
        `Failed to update SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Alias for deleteSEOConfig
  async remove(id: string): Promise<SEOConfigEntity> {
    try {
      // Check if the SEO config exists
      const existingConfig = await this.prismaService.sEOConfig.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        throw new NotFoundException(`SEO config with ID ${id} not found`);
      }

      // Delete the SEO config
      const deletedConfig = await this.prismaService.sEOConfig.delete({
        where: { id },
      });

      return SEOConfigEntity.fromPrisma(deletedConfig);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in remove: ${errorMessage}`, errorStack);
      throw new DatabaseException(
        `Failed to delete SEO config: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Alias for findActiveSEOConfigs
  async getActiveSEOConfig(
    page: string,
    lang?: string,
  ): Promise<SEOConfigEntity[]> {
    try {
      const where: Prisma.SEOConfigWhereInput = {
        page,
        isActive: true,
      };

      if (lang) {
        where.lang = lang;
      }

      const configs = await this.prismaService.sEOConfig.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      return configs.map((config) => SEOConfigEntity.fromPrisma(config));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in getActiveSEOConfig: ${errorMessage}`,
        errorStack,
      );
      throw new DatabaseException(
        `Failed to retrieve active SEO configs: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Alias for findSEOConfigsByPage
  async findByPage(page: string, lang?: string): Promise<SEOConfigEntity[]> {
    try {
      const where: Prisma.SEOConfigWhereInput = { page };

      if (lang) {
        where.lang = lang;
      }

      const configs = await this.prismaService.sEOConfig.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });

      return configs.map((config) => SEOConfigEntity.fromPrisma(config));
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findByPage: ${errorMessage}`, errorStack);
      throw new DatabaseException(
        `Failed to retrieve SEO configs for page ${page}: ${errorMessage}`,
        undefined,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Alias for findAllWithPagination
  async findAllWithPagination(
    paginationDto: PaginationDto,
    filters?: SEOConfigFilterDto,
  ): Promise<{ data: SEOConfigEntity[]; meta: any }> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const where = this.buildWhereClause(filters);

      const [data, total] = await Promise.all([
        this.prismaService.sEOConfig.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prismaService.sEOConfig.count({ where }),
      ]);

      return {
        data: data.map((item) => SEOConfigEntity.fromPrisma(item)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findAllWithPagination: ${errorMessage}`,
        errorStack,
      );
      throw new DatabaseException(
        `Failed to retrieve paginated SEO configs: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  // Helper method to build where clauses
  private buildWhereClause(
    filters?: SEOConfigFilterDto,
  ): Prisma.SEOConfigWhereInput {
    const where: Prisma.SEOConfigWhereInput = {};

    if (!filters) return where;

    if (filters.page) {
      where.page = filters.page;
    }

    if (filters.lang) {
      where.lang = filters.lang;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }
}
