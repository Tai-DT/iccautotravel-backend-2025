import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerEntity } from './entities/banner.entity';
import { BannerPaginationResponse } from './entities/banner-pagination-response.entity';
import { CreateBannerInput } from './dto/create-banner.input';
import { UpdateBannerInput } from './dto/update-banner.input';
import { BannerFilterInput } from './dto/banner-filter.input';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GraphQLJwtAuthGuard } from '../auth/guards/graphql-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_NAMES } from '../common/constants/roles';
import { BannerPosition } from './enums/banner-position.enum';
import { BannerType } from './enums/banner-type.enum';

@Resolver(() => BannerEntity)
export class BannerResolver {
  constructor(private readonly bannerService: BannerService) {}

  @Mutation(() => BannerEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async createBanner(
    @Args('input') createBannerInput: CreateBannerInput,
  ): Promise<BannerEntity> {
    const banner = await this.bannerService.create(createBannerInput);
    return BannerEntity.fromPrisma(banner);
  }

  @Query(() => [BannerEntity], { name: 'banners' })
  async findAllBanners(
    @Args('filters', { nullable: true }) filters?: BannerFilterInput,
  ): Promise<BannerEntity[]> {
    const banners = await this.bannerService.findAll(filters || {});
    return banners.map((banner) => BannerEntity.fromPrisma(banner));
  }

  @Query(() => BannerPaginationResponse, { name: 'bannersPaginated' })
  async findAllBannersPaginated(
    @Args('pagination') paginationDto: PaginationDto,
    @Args('filters', { nullable: true }) filters?: BannerFilterInput,
  ): Promise<BannerPaginationResponse> {
    const { data, total, page, limit } =
      await this.bannerService.findAllWithPagination(
        paginationDto,
        filters || {},
      );
    return {
      data: data.map((banner) => BannerEntity.fromPrisma(banner)),
      metadata: { total, page: page || 1, limit: limit || 10 },
    };
  }

  @Query(() => [BannerEntity], { name: 'bannersByPosition' })
  async findBannersByPosition(
    @Args('position', { type: () => BannerPosition }) position: BannerPosition,
    @Args('lang', { defaultValue: 'vi' }) lang: string,
  ): Promise<BannerEntity[]> {
    const banners = await this.bannerService.findByPosition(position, lang);
    return banners.map((banner) => BannerEntity.fromPrisma(banner));
  }

  @Query(() => [BannerEntity], { name: 'bannersByType' })
  async findBannersByType(
    @Args('type', { type: () => BannerType }) type: BannerType,
    @Args('lang', { defaultValue: 'vi' }) lang: string,
  ): Promise<BannerEntity[]> {
    const banners = await this.bannerService.findByType(type, lang);
    return banners.map((banner) => BannerEntity.fromPrisma(banner));
  }

  @Query(() => [BannerEntity], { name: 'activeBanners' })
  async getActiveBanners(
    @Args('position', { type: () => BannerPosition, nullable: true })
    position?: BannerPosition,
    @Args('lang', { defaultValue: 'vi' }) lang?: string,
  ): Promise<BannerEntity[]> {
    const banners = await this.bannerService.getActiveBanners(position, lang);
    return banners.map((banner) => BannerEntity.fromPrisma(banner));
  }

  @Query(() => BannerEntity, { name: 'banner', nullable: true })
  async findOneBanner(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BannerEntity | null> {
    try {
      const banner = await this.bannerService.findOne(id);
      return BannerEntity.fromPrisma(banner);
    } catch {
      return null;
    }
  }

  @Mutation(() => BannerEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async updateBanner(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateBannerInput: UpdateBannerInput,
  ): Promise<BannerEntity> {
    const banner = await this.bannerService.update(id, updateBannerInput);
    return BannerEntity.fromPrisma(banner);
  }

  @Mutation(() => BannerEntity)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async removeBanner(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BannerEntity> {
    const banner = await this.bannerService.remove(id);
    return BannerEntity.fromPrisma(banner);
  }

  @Mutation(() => Boolean)
  @UseGuards(GraphQLJwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async reorderBanners(
    @Args('ids', { type: () => [String] }) ids: string[],
  ): Promise<boolean> {
    return this.bannerService.reorder(ids);
  }
}
