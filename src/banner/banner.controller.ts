import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerFilterDto } from './dto/banner-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Prisma } from '@prisma/client';
import { ROLE_NAMES } from '../common/constants/roles';
import { BannerPosition } from './enums/banner-position.enum';
import { BannerType } from './enums/banner-type.enum';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannerService.create(createBannerDto);
  }

  @Get()
  async findAll(@Query() filters: BannerFilterDto) {
    return this.bannerService.findAll(filters);
  }

  @Get('paginated')
  async findAllPaginated(
    @Query() paginationDto: PaginationDto,
    @Query() filters: BannerFilterDto,
  ) {
    return this.bannerService.findAllWithPagination(paginationDto, filters);
  }

  @Get('position/:position')
  async findByPosition(
    @Param('position') position: BannerPosition,
    @Query('lang') lang: string = 'vi',
  ) {
    return this.bannerService.findByPosition(position, lang);
  }

  @Get('type/:type')
  async findByType(
    @Param('type') type: BannerType,
    @Query('lang') lang: string = 'vi',
  ) {
    return this.bannerService.findByType(type, lang);
  }

  @Get('active')
  async getActiveBanners(
    @Query('position') position?: BannerPosition,
    @Query('lang') lang: string = 'vi',
  ) {
    return this.bannerService.getActiveBanners(position, lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.bannerService.remove(id);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_NAMES.ADMIN, ROLE_NAMES.STAFF)
  async reorder(@Body() body: { ids: string[] }) {
    return this.bannerService.reorder(body.ids);
  }
}
