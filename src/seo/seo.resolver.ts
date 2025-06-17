import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SEOService } from './seo.service';
import { SEOConfigEntity } from './entities/seo-config.entity';
import { SEOConfigPaginationResponse } from './entities/seo-config-pagination-response.entity';
import { CreateSEOConfigInput } from './dto/create-seo-config.input';
import { UpdateSEOConfigInput } from './dto/update-seo-config.input';
import { SEOConfigFilterInput } from './dto/seo-config-filter.input';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => SEOConfigEntity)
export class SEOResolver {
  constructor(private readonly seoService: SEOService) {}

  @Mutation(() => SEOConfigEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async createSEOConfig(
    @Args('input') createSEOConfigInput: CreateSEOConfigInput,
  ): Promise<SEOConfigEntity> {
    const seoConfig = await this.seoService.create(createSEOConfigInput);
    return SEOConfigEntity.fromPrisma(seoConfig);
  }

  @Query(() => [SEOConfigEntity], { name: 'seoConfigs' })
  async findAllSEOConfigs(
    @Args('filters', { nullable: true }) filters?: SEOConfigFilterInput,
  ): Promise<SEOConfigEntity[]> {
    const seoConfigs = await this.seoService.findAll(filters || {});
    return seoConfigs.map((config) => SEOConfigEntity.fromPrisma(config));
  }

  @Query(() => SEOConfigPaginationResponse, { name: 'seoConfigsPaginated' })
  async findAllSEOConfigsPaginated(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true }) filters?: SEOConfigFilterInput,
  ): Promise<SEOConfigPaginationResponse> {
    const result = await this.seoService.findAllWithPagination(
      paginationDto,
      filters || {},
    );
    // Access meta object instead of direct properties
    return {
      data: result.data.map((config) => SEOConfigEntity.fromPrisma(config)),
      metadata: {
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit,
      },
    };
  }

  @Query(() => SEOConfigEntity, { name: 'seoConfigByPage', nullable: true })
  async findSEOConfigByPage(
    @Args('page') page: string,
    @Args('lang', { defaultValue: 'vi' }) lang: string,
  ): Promise<SEOConfigEntity | null> {
    const seoConfig = await this.seoService.findByPage(page, lang);
    return seoConfig ? SEOConfigEntity.fromPrisma(seoConfig) : null;
  }

  @Query(() => [SEOConfigEntity], { name: 'activeSEOConfigs' })
  async getActiveSEOConfigs(
    @Args('page', { nullable: true }) page?: string,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<SEOConfigEntity[]> {
    const seoConfigs = await this.seoService.getActiveSEOConfig(
      page || '',
      lang || 'vi',
    );
    return seoConfigs.map((config) => SEOConfigEntity.fromPrisma(config));
  }

  @Query(() => SEOConfigEntity, { name: 'seoConfig', nullable: true })
  async findOneSEOConfig(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SEOConfigEntity | null> {
    try {
      const seoConfig = await this.seoService.findOne(id);
      return SEOConfigEntity.fromPrisma(seoConfig);
    } catch {
      return null;
    }
  }

  @Mutation(() => SEOConfigEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async updateSEOConfig(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateSEOConfigInput: UpdateSEOConfigInput,
  ): Promise<SEOConfigEntity> {
    const seoConfig = await this.seoService.update(id, updateSEOConfigInput);
    return SEOConfigEntity.fromPrisma(seoConfig);
  }

  @Mutation(() => SEOConfigEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async removeSEOConfig(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SEOConfigEntity> {
    const seoConfig = await this.seoService.remove(id);
    return SEOConfigEntity.fromPrisma(seoConfig);
  }

  @Mutation(() => SEOConfigEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async upsertSEOConfig(
    @Args('page') page: string,
    @Args('lang') lang: string,
    @Args('input') createSEOConfigInput: CreateSEOConfigInput,
  ): Promise<SEOConfigEntity> {
    const seoConfig = await this.seoService.upsertSEOConfig(
      page,
      lang,
      createSEOConfigInput,
    );
    return SEOConfigEntity.fromPrisma(seoConfig);
  }
}
