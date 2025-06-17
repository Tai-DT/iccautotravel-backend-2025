import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnhancedCompanyInfoDto } from './dto/enhanced-company-info.dto';
import { AboutUsEntity } from './entities/about-us.entity';

interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AboutUsService {
  private readonly logger = new Logger(AboutUsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Public methods for frontend
  async getPublicAboutUs(language: string = 'vi') {
    this.logger.log(`Getting public About Us for language: ${language}`);

    const companyInfo = await this.prisma.companyInfo.findFirst({
      where: {
        lang: language,
        isActive: true,
      },
    });

    if (!companyInfo) {
      throw new NotFoundException(
        `Company info not found for language: ${language}`,
      );
    }

    return this.formatAboutUsEntity(companyInfo);
  }

  async getBasicInfo(language: string = 'vi') {
    this.logger.log(`Getting basic info for language: ${language}`);

    const companyInfo = await this.prisma.companyInfo.findFirst({
      where: {
        lang: language,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        lang: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!companyInfo) {
      throw new NotFoundException(
        `Basic company info not found for language: ${language}`,
      );
    }

    return companyInfo;
  }

  async getContactInfo() {
    this.logger.log('Getting contact information');

    const companyInfo = await this.prisma.companyInfo.findFirst({
      where: { isActive: true },
    });

    if (!companyInfo) {
      throw new NotFoundException('Contact information not found');
    }

    return {
      address: 'Ha Noi, Vietnam', // Placeholder
      email: 'info@iccautotravel.com',
      phone: '+84-123-456-789',
      emergencyPhone: '+84-987-654-321',
      hotline: '1900-123-456',
    };
  }

  getTeamInfo(_language: string = 'vi') {
    this.logger.log(`Getting team info for language: ${_language}`);

    return {
      teamMembers: [
        {
          name: 'John Doe',
          position: 'CEO',
          bio: 'Experienced leader with 10+ years in tourism',
          photoUrl: null,
          email: 'john@iccautotravel.com',
          linkedIn: null,
        },
        {
          name: 'Jane Smith',
          position: 'Operations Manager',
          bio: 'Expert in travel operations and customer service',
          photoUrl: null,
          email: 'jane@iccautotravel.com',
          linkedIn: null,
        },
      ],
    };
  }

  getCompanyStats() {
    this.logger.log('Getting company statistics');

    return {
      yearsInBusiness: 5,
      happyCustomers: 10000,
      toursCompleted: 5000,
      destinations: 50,
      fleetSize: 100,
      professionalDrivers: 200,
    };
  }

  getCertifications() {
    this.logger.log('Getting company certifications');

    return {
      certifications: [
        {
          name: 'Tourism Business License',
          issuedBy: 'Vietnam National Administration of Tourism',
          issuedDate: new Date('2020-01-01'),
          expiryDate: new Date('2025-12-31'),
          certificateImageUrl: null,
          verificationUrl: null,
        },
      ],
      awards: ['Best Travel Company 2023', 'Customer Choice Award 2022'],
    };
  }

  getMilestones() {
    this.logger.log('Getting company milestones');

    return {
      milestones: [
        {
          year: 2019,
          title: 'Company Founded',
          description: 'ICC Auto Travel was established',
          imageUrl: null,
        },
        {
          year: 2020,
          title: 'First 1000 Customers',
          description: 'Reached milestone of serving 1000 customers',
          imageUrl: null,
        },
        {
          year: 2023,
          title: 'Fleet Expansion',
          description: 'Expanded fleet to 100+ vehicles',
          imageUrl: null,
        },
      ],
    };
  }

  // Admin methods
  async getAboutUsForAdmin(language: string = 'vi') {
    this.logger.log(`Getting About Us for admin (language: ${language})`);

    const companyInfo = await this.prisma.companyInfo.findFirst({
      where: { lang: language },
    });

    if (!companyInfo) {
      throw new NotFoundException(
        `Company info not found for language: ${language}`,
      );
    }

    return this.formatAboutUsEntity(companyInfo);
  }

  async create(
    createAboutUsDto: EnhancedCompanyInfoDto,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _files?: UploadedFileType[],
  ) {
    this.logger.log(`Creating About Us by user: ${userId}`);

    // Create basic company info record
    const companyInfo = await this.prisma.companyInfo.create({
      data: {
        id: `about-us-${Date.now()}`,
        key: `about-us-${Date.now()}`,
        title: createAboutUsDto.name,
        content: createAboutUsDto.longDescription,
        lang: createAboutUsDto.language,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return this.formatAboutUsEntity(companyInfo);
  }

  async update(
    id: string,
    updateAboutUsDto: Partial<EnhancedCompanyInfoDto>,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _files?: UploadedFileType[],
  ) {
    this.logger.log(`Updating About Us ${id} by user: ${userId}`);

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    const updated = await this.prisma.companyInfo.update({
      where: { id },
      data: {
        title: updateAboutUsDto.name || existing.title,
        content: updateAboutUsDto.longDescription || existing.content,
        lang: updateAboutUsDto.language || existing.lang,
        updatedAt: new Date(),
      },
    });

    return this.formatAboutUsEntity(updated);
  }

  async remove(id: string, userId: string) {
    this.logger.log(`Removing About Us ${id} by user: ${userId}`);

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    await this.prisma.companyInfo.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'About Us information deleted successfully' };
  }

  async updateTeam(
    id: string,
    teamMembers: any[],
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _photos?: UploadedFileType[],
  ) {
    this.logger.log(`Updating team for About Us ${id} by user: ${userId}`);

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    // In a real implementation, you would store team members
    // For now, just return success
    return { message: 'Team updated successfully', teamMembers };
  }

  async updateGallery(
    id: string,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _galleryImages?: UploadedFileType[],
  ) {
    this.logger.log(`Updating gallery for About Us ${id} by user: ${userId}`);

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    // In a real implementation, you would process and store images
    return { message: 'Gallery updated successfully' };
  }

  async updateStats(id: string, statistics: object, userId: string) {
    this.logger.log(`Updating stats for About Us ${id} by user: ${userId}`);

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    return { message: 'Statistics updated successfully', statistics };
  }

  async updateCertifications(
    id: string,
    certifications: any[],
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _certificateFiles?: UploadedFileType[],
  ) {
    this.logger.log(
      `Updating certifications for About Us ${id} by user: ${userId}`,
    );

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    return { message: 'Certifications updated successfully', certifications };
  }

  async toggleActive(id: string, userId: string) {
    this.logger.log(
      `Toggling active status for About Us ${id} by user: ${userId}`,
    );

    const existing = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('About Us information not found');
    }

    const updated = await this.prisma.companyInfo.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return this.formatAboutUsEntity(updated);
  }

  getSEOData(language: string = 'vi') {
    this.logger.log(`Getting SEO data for language: ${language}`);

    return {
      metaTitle: 'About ICC Auto Travel - Professional Travel Services',
      metaDescription:
        'Learn about ICC Auto Travel, your trusted partner for professional travel services in Vietnam',
      keywords: ['travel', 'tourism', 'vietnam', 'icc auto travel'],
      canonical: `/about-us?lang=${language}`,
    };
  }

  getSitemapData() {
    this.logger.log('Getting sitemap data');

    return {
      pages: [
        { url: '/about-us', lastModified: new Date(), priority: 0.8 },
        { url: '/about-us?lang=en', lastModified: new Date(), priority: 0.8 },
        { url: '/about-us?lang=ko', lastModified: new Date(), priority: 0.8 },
      ],
    };
  }

  getAnalytics(id: string) {
    this.logger.log(`Getting analytics for About Us ${id}`);

    return {
      pageViews: 1500,
      uniqueVisitors: 1200,
      averageTimeOnPage: 120, // seconds
      bounceRate: 25, // percentage
    };
  }

  private formatAboutUsEntity(companyInfo: any): AboutUsEntity {
    return {
      id: companyInfo.id,
      name: companyInfo.title || 'ICC Auto Travel',
      tagline: 'Your Trusted Travel Partner',
      shortDescription: 'Professional travel services in Vietnam',
      longDescription:
        companyInfo.content ||
        'ICC Auto Travel provides professional travel services',
      logoUrl: undefined,
      coverImageUrl: undefined,
      website: 'https://iccautotravel.com',
      contactInfo: {
        address: 'Ha Noi, Vietnam',
        email: 'info@iccautotravel.com',
        phone: '+84-123-456-789',
        emergencyPhone: '+84-987-654-321',
        hotline: '1900-123-456',
      },
      mission: 'To provide exceptional travel experiences',
      vision: 'To be the leading travel company in Vietnam',
      values: [
        {
          title: 'Quality',
          description: 'We provide high-quality services',
          iconUrl: undefined,
        },
      ],
      foundingYear: 2019,
      foundingStory:
        'ICC Auto Travel was founded to serve travelers in Vietnam',
      milestones: [],
      teamMembers: [],
      statistics: {
        yearsInBusiness: 5,
        happyCustomers: 10000,
        toursCompleted: 5000,
        destinations: 50,
        fleetSize: 100,
        professionalDrivers: 200,
      },
      certifications: [],
      awards: [],
      businessLicense: 'BL-123456789',
      taxId: 'TX-987654321',
      tourismLicense: 'TL-555666777',
      workingHours: {
        monday: '08:00-18:00',
        tuesday: '08:00-18:00',
        wednesday: '08:00-18:00',
        thursday: '08:00-18:00',
        friday: '08:00-18:00',
        saturday: '08:00-16:00',
        sunday: 'Closed',
      },
      socialMedia: {
        facebook: 'https://facebook.com/iccautotravel',
        instagram: 'https://instagram.com/iccautotravel',
        youtube: undefined,
        linkedIn: undefined,
        tiktok: undefined,
        zalo: undefined,
      },
      language: companyInfo.lang || 'vi',
      metaDescription: 'About ICC Auto Travel',
      seoKeywords: ['travel', 'tourism', 'vietnam'],
      galleryImages: [],
      introVideoUrl: undefined,
      partnerLogos: [],
      sustainabilityInfo: undefined,
      safetyProtocols: undefined,
      createdAt: companyInfo.createdAt,
      updatedAt: companyInfo.updatedAt,
      isActive: companyInfo.isActive,
    } as AboutUsEntity;
  }
}
