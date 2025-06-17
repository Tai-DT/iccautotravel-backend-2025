import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SEOService } from './seo.service';
import { CreateSEOConfigDto } from './dto/create-seo-config.dto';
import { UpdateSEOConfigDto } from './dto/update-seo-config.dto';
import { UpsertSEOConfigDto } from './dto/upsert-seo-config.dto';
import { SEOConfigFilterDto } from './dto/seo-config-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('seo')
export class SEOController {
  constructor(private readonly seoService: SEOService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSEOConfigDto: CreateSEOConfigDto) {
    return this.seoService.create(createSEOConfigDto);
  }

  @Get()
  async findAll(@Query() filters: SEOConfigFilterDto) {
    return this.seoService.findAll(filters);
  }

  @Get('paginated')
  async findAllPaginated(
    @Query() paginationDto: PaginationDto,
    @Query() filters: SEOConfigFilterDto,
  ) {
    return this.seoService.findAllWithPagination(paginationDto, filters);
  }

  @Get('page/:page')
  async findByPage(
    @Param('page') page: string,
    @Query('lang') lang: string = 'vi',
  ) {
    return this.seoService.findByPage(page, lang);
  }

  @Get('active')
  async getActiveSEOConfigs(
    @Query('page') page?: string,
    @Query('lang') lang: string = 'vi',
  ) {
    // Ensure page is always a string when passed to the service
    return this.seoService.getActiveSEOConfig(page || '', lang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.seoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async update(
    @Param('id') id: string,
    @Body() updateSEOConfigDto: UpdateSEOConfigDto,
  ) {
    return this.seoService.update(id, updateSEOConfigDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.seoService.remove(id);
  }

  @Post('upsert/:page/:lang')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async upsert(
    @Param('page') page: string,
    @Param('lang') lang: string,
    @Body() upsertSEOConfigDto: UpsertSEOConfigDto,
  ) {
    return this.seoService.upsertSEOConfig(page, lang, upsertSEOConfigDto);
  }
}
