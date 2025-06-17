import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerFilterDto } from './dto/banner-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma, BannerPosition, BannerType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(private readonly prismaService: PrismaService) {
    this.logger.log(
      `BannerService instantiated with PrismaService. Checking for this.prismaService.banner...`,
    );
    if (this.prismaService.banner) {
      this.logger.log(
        `this.prismaService.banner is available. Type: ${typeof this.prismaService.banner}`,
      );
    } else {
      this.logger.error('CRITICAL: this.prismaService.banner is UNDEFINED.');
    }
  }

  async create(createBannerDto: CreateBannerDto) {
    try {
      const now = new Date();
      const banner = await this.prismaService.banner.create({
        data: {
          id: uuidv4(), // Add id
          ...createBannerDto,
          startDate: createBannerDto.startDate
            ? new Date(createBannerDto.startDate)
            : null,
          endDate: createBannerDto.endDate
            ? new Date(createBannerDto.endDate)
            : null,
          createdAt: now, // Add createdAt
          updatedAt: now, // Add updatedAt
        },
      });
      this.logger.log(`Created banner: ${banner.id}`);
      return banner;
    } catch (error) {
      this.logger.error(`Failed to create banner: ${(error as Error).message}`);
      throw error;
    }
  }

  async findAll(filters: BannerFilterDto = {}) {
    const where: Prisma.BannerWhereInput = {};

    if (filters.position) {
      where.position = filters.position as BannerPosition;
    }
    if (filters.type) {
      where.type = filters.type as BannerType;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.lang) {
      where.lang = filters.lang;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { subtitle: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const now = new Date();
    if (filters.isActive === true) {
      where.AND = [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ];
    }

    return this.prismaService.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAllWithPagination(
    paginationDto: PaginationDto,
    filters: BannerFilterDto = {},
  ) {
    this.logger.debug(
      `findAllWithPagination called with DTO: ${JSON.stringify(paginationDto)}, Filters: ${JSON.stringify(filters)}`,
    );
    const { page = 1, limit = 10 } = paginationDto;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    this.logger.debug(
      `Calculated - Page: ${page}, Limit: ${take}, Skip: ${skip}`,
    );

    const where: Prisma.BannerWhereInput = {};

    if (filters.position) {
      where.position = filters.position as BannerPosition;
    }
    if (filters.type) {
      where.type = filters.type as BannerType;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.lang) {
      where.lang = filters.lang;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { subtitle: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const data = await this.prismaService.banner.findMany({
      where,
      skip,
      take: take, // Corrected: use 'take' which is Number(limit)
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const total = await this.prismaService.banner.count({ where });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findByPosition(position: BannerPosition, lang: string = 'vi') {
    const now = new Date();
    return this.prismaService.banner.findMany({
      where: {
        position: position as BannerPosition,
        lang,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByType(type: BannerType, lang: string = 'vi') {
    const now = new Date();
    return this.prismaService.banner.findMany({
      where: {
        type: type as BannerType,
        lang,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const banner = await this.prismaService.banner.findUnique({
      where: { id },
    });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    try {
      const banner = await this.prismaService.banner.update({
        where: { id },
        data: {
          ...updateBannerDto,
          startDate: updateBannerDto.startDate
            ? new Date(updateBannerDto.startDate)
            : undefined, // Keep undefined if not provided, or null to clear
          endDate: updateBannerDto.endDate
            ? new Date(updateBannerDto.endDate)
            : undefined, // Keep undefined if not provided, or null to clear
          updatedAt: new Date(), // Add updatedAt
        },
      });
      this.logger.log(`Updated banner: ${banner.id}`);
      return banner;
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new NotFoundException(`Banner with ID ${id} not found`);
      }
      this.logger.error(`Failed to update banner: ${(error as Error).message}`);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const banner = await this.prismaService.banner.delete({
        where: { id },
      });
      this.logger.log(`Deleted banner: ${banner.id}`);
      return banner;
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new NotFoundException(`Banner with ID ${id} not found`);
      }
      this.logger.error(`Failed to delete banner: ${(error as Error).message}`);
      throw error;
    }
  }

  async reorder(ids: string[]) {
    try {
      const updates = ids.map((id, index) =>
        this.prismaService.banner.update({
          where: { id },
          data: { sortOrder: index },
        }),
      );
      await this.prismaService.$transaction(updates);
      this.logger.log(`Reordered ${ids.length} banners`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reorder banners: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async getActiveBanners(position?: BannerPosition, lang: string = 'vi') {
    const now = new Date();
    const where: Prisma.BannerWhereInput = {
      isActive: true,
      lang,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    if (position) {
      where.position = position as BannerPosition;
    }
    return this.prismaService.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
