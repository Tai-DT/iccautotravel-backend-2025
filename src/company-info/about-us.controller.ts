import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { EnhancedCompanyInfoDto } from './dto/enhanced-company-info.dto';
import { AboutUsEntity } from './entities/about-us.entity';
import { AboutUsService } from './about-us.service';

interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('about-us')
@ApiTags('About Us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS (No Authentication)
  // ==========================================

  @Get('public')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // 1 hour cache
  @ApiOperation({
    summary: 'Get public About Us information',
    description: 'Retrieve company information for public display',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['vi', 'en', 'ko'],
    description: 'Language preference',
  })
  @ApiResponse({
    status: 200,
    description: 'About Us information retrieved successfully',
    type: AboutUsEntity,
  })
  async getPublicAboutUs(@Query('lang') language: string = 'vi') {
    return await this.aboutUsService.getPublicAboutUs(language);
  }

  @Get('public/basic')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Get basic company information',
    description: 'Retrieve essential company info for quick display',
  })
  @ApiQuery({ name: 'lang', required: false, enum: ['vi', 'en', 'ko'] })
  async getBasicInfo(@Query('lang') language: string = 'vi') {
    return await this.aboutUsService.getBasicInfo(language);
  }

  @Get('public/contact')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800) // 30 minutes cache
  @ApiOperation({
    summary: 'Get contact information',
    description: 'Retrieve company contact details',
  })
  async getContactInfo() {
    return await this.aboutUsService.getContactInfo();
  }

  @Get('public/team')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Get team information',
    description: 'Retrieve company team members',
  })
  @ApiQuery({ name: 'lang', required: false, enum: ['vi', 'en', 'ko'] })
  async getTeamInfo(@Query('lang') language: string = 'vi') {
    return await this.aboutUsService.getTeamInfo(language);
  }

  @Get('public/stats')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1800)
  @ApiOperation({
    summary: 'Get company statistics',
    description: 'Retrieve company achievements and statistics',
  })
  async getCompanyStats() {
    return await this.aboutUsService.getCompanyStats();
  }

  @Get('public/certifications')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Get company certifications',
    description: 'Retrieve company certifications and awards',
  })
  async getCertifications() {
    return await this.aboutUsService.getCertifications();
  }

  @Get('public/milestones')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Get company milestones',
    description: 'Retrieve company history and milestones',
  })
  async getMilestones() {
    return await this.aboutUsService.getMilestones();
  }

  // ==========================================
  // ADMIN ENDPOINTS (Authentication Required)
  // ==========================================

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get About Us for admin management',
    description: 'Retrieve complete About Us data for administrative purposes',
  })
  @ApiQuery({ name: 'lang', required: false, enum: ['vi', 'en', 'ko'] })
  async getAboutUsForAdmin(@Query('lang') language: string = 'vi') {
    return await this.aboutUsService.getAboutUsForAdmin(language);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:create')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create About Us information',
    description: 'Create new About Us content with file uploads',
  })
  @ApiResponse({
    status: 201,
    description: 'About Us created successfully',
    type: AboutUsEntity,
  })
  async createAboutUs(
    @Body() createAboutUsDto: EnhancedCompanyInfoDto,
    @CurrentUser() user: User,
    @UploadedFiles() files?: UploadedFileType[],
  ) {
    return await this.aboutUsService.create(createAboutUsDto, user.id, files);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update About Us information',
    description: 'Update existing About Us content',
  })
  async updateAboutUs(
    @Param('id') id: string,
    @Body() updateAboutUsDto: Partial<EnhancedCompanyInfoDto>,
    @CurrentUser() user: User,
    @UploadedFiles() files?: UploadedFileType[],
  ) {
    return await this.aboutUsService.update(
      id,
      updateAboutUsDto,
      user.id,
      files,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:delete')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete About Us information',
    description: 'Soft delete About Us content',
  })
  async deleteAboutUs(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.aboutUsService.remove(id, user.id);
  }

  // ==========================================
  // ADVANCED MANAGEMENT ENDPOINTS
  // ==========================================

  @Put(':id/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  @UseInterceptors(
    FilesInterceptor('photos', 20, {
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB per photo
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed for photos'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update team information',
    description: 'Update team members with photos',
  })
  async updateTeam(
    @Param('id') id: string,
    @Body('teamMembers') teamMembers: string, // JSON string
    @CurrentUser() user: User,
    @UploadedFiles() photos?: UploadedFileType[],
  ) {
    const parsedTeamMembers = JSON.parse(teamMembers);
    return await this.aboutUsService.updateTeam(
      id,
      parsedTeamMembers,
      user.id,
      photos,
    );
  }

  @Put(':id/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FilesInterceptor('galleryImages', 30, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update company gallery',
    description: 'Update company gallery images',
  })
  async updateGallery(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFiles() galleryImages?: UploadedFileType[],
  ) {
    return await this.aboutUsService.updateGallery(id, user.id, galleryImages);
  }

  @Put(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update company statistics',
    description: 'Update company achievement numbers',
  })
  async updateStats(
    @Param('id') id: string,
    @Body('statistics') statistics: object,
    @CurrentUser() user: User,
  ) {
    return await this.aboutUsService.updateStats(id, statistics, user.id);
  }

  @Put(':id/certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FilesInterceptor('certificateFiles', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per certificate
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/', 'application/pdf'];
        if (!allowedTypes.some((type) => file.mimetype.startsWith(type))) {
          return cb(
            new BadRequestException('Only images and PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update certifications',
    description: 'Update company certifications with documents',
  })
  async updateCertifications(
    @Param('id') id: string,
    @Body('certifications') certifications: string, // JSON string
    @CurrentUser() user: User,
    @UploadedFiles() certificateFiles?: UploadedFileType[],
  ) {
    const parsedCertifications = JSON.parse(certifications);
    return await this.aboutUsService.updateCertifications(
      id,
      parsedCertifications,
      user.id,
      certificateFiles,
    );
  }

  @Put(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('content:update')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle active status',
    description: 'Toggle the active status of About Us content',
  })
  async toggleActive(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.aboutUsService.toggleActive(id, user.id);
  }

  // ==========================================
  // SEO & ANALYTICS ENDPOINTS
  // ==========================================

  @Get('seo')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @ApiOperation({
    summary: 'Get SEO data for About Us',
    description: 'Retrieve SEO metadata and structured data',
  })
  async getSEOData(@Query('lang') language: string = 'vi') {
    return await this.aboutUsService.getSEOData(language);
  }

  @Get('sitemap')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(86400) // 24 hours cache
  @ApiOperation({
    summary: 'Get sitemap data',
    description: 'Retrieve sitemap URLs for About Us pages',
  })
  async getSitemapData() {
    return await this.aboutUsService.getSitemapData();
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('analytics:read')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get About Us analytics',
    description: 'Retrieve page views and engagement data',
  })
  async getAnalytics(@Param('id') id: string) {
    return await this.aboutUsService.getAnalytics(id);
  }
}
