import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { LocationFilterDto } from './dto/location-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LocationEntity, LocationType } from './entities/location.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createLocationInput: CreateLocationInput,
  ): Promise<LocationEntity> {
    const id = uuidv4();

    // Use Prisma ORM instead of raw SQL to avoid undefined column issues
    const createdLocation = await this.prisma.location.create({
      data: {
        id,
        name: createLocationInput.name,
        address: createLocationInput.address,
        district: createLocationInput.district,
        city: createLocationInput.city,
        country: createLocationInput.country,
        zipCode: createLocationInput.zipCode,
        latitude: createLocationInput.latitude,
        longitude: createLocationInput.longitude,
        type: createLocationInput.type,
        description: createLocationInput.description,
        imageUrl: createLocationInput.imageUrl,
        isActive: createLocationInput.isActive ?? true,
        isPopular: createLocationInput.isPopular ?? false,
        updatedAt: new Date(),
      },
    });

    return this.mapToLocationEntity(createdLocation);
  }

  private mapToLocationEntity(location: any): LocationEntity {
    return {
      id: location.id,
      name: location.name,
      address: location.address || undefined,
      district: location.district || undefined,
      city: location.city || undefined,
      country: location.country || undefined,
      zipCode: location.zipCode || undefined,
      latitude: location.latitude || undefined,
      longitude: location.longitude || undefined,
      type: location.type,
      description: location.description || undefined,
      imageUrl: location.imageUrl || undefined,
      isActive: location.isActive,
      isPopular: location.isPopular,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }

  async findAllWithPagination(
    paginationDto: PaginationDto,
    filters?: LocationFilterDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build WHERE clause for SQL query
    let whereClause = '';
    const conditions = [];

    if (filters) {
      if (filters.search) {
        conditions.push(`(
          "name" ILIKE '%${filters.search}%' OR 
          "address" ILIKE '%${filters.search}%' OR 
          "city" ILIKE '%${filters.search}%'
        )`);
      }

      if (filters.type) {
        conditions.push(`"type" = '${filters.type}'`);
      }

      if (filters.country) {
        conditions.push(`"country" = '${filters.country}'`);
      }

      if (filters.city) {
        conditions.push(`"city" = '${filters.city}'`);
      }

      if (filters.isActive !== undefined) {
        conditions.push(`"isActive" = ${filters.isActive}`);
      }

      if (filters.isPopular !== undefined) {
        conditions.push(`"isPopular" = ${filters.isPopular}`);
      }
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Execute queries
    const [locationsResult, totalResult] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT * FROM "Location" 
        ${Prisma.raw(whereClause)}
        ORDER BY "name" ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM "Location" 
        ${Prisma.raw(whereClause)}
      `,
    ]);

    const total = parseInt(totalResult[0].count, 10);

    return {
      data: locationsResult.map((location) =>
        this.mapToLocationEntity(location),
      ),
      total,
      page: page || 1,
      limit: limit || 10,
    };
  }

  async findOne(id: string): Promise<LocationEntity> {
    const locations = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Location" WHERE id = ${id}
    `;

    if (!locations || locations.length === 0) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return this.mapToLocationEntity(locations[0]);
  }

  async update(
    id: string,
    updateLocationInput: UpdateLocationInput,
  ): Promise<LocationEntity> {
    // Check if location exists first
    await this.findOne(id);

    // Use Prisma ORM for safe updates
    const updatedLocation = await this.prisma.location.update({
      where: { id },
      data: {
        ...(updateLocationInput.name && { name: updateLocationInput.name }),
        ...(updateLocationInput.address && {
          address: updateLocationInput.address,
        }),
        ...(updateLocationInput.district && {
          district: updateLocationInput.district,
        }),
        ...(updateLocationInput.city && { city: updateLocationInput.city }),
        ...(updateLocationInput.country && {
          country: updateLocationInput.country,
        }),
        ...(updateLocationInput.zipCode && {
          zipCode: updateLocationInput.zipCode,
        }),
        ...(updateLocationInput.latitude !== undefined && {
          latitude: updateLocationInput.latitude,
        }),
        ...(updateLocationInput.longitude !== undefined && {
          longitude: updateLocationInput.longitude,
        }),
        ...(updateLocationInput.type && { type: updateLocationInput.type }),
        ...(updateLocationInput.description && {
          description: updateLocationInput.description,
        }),
        ...(updateLocationInput.imageUrl && {
          imageUrl: updateLocationInput.imageUrl,
        }),
        ...(updateLocationInput.isActive !== undefined && {
          isActive: updateLocationInput.isActive,
        }),
        ...(updateLocationInput.isPopular !== undefined && {
          isPopular: updateLocationInput.isPopular,
        }),
        updatedAt: new Date(),
      },
    });

    return this.mapToLocationEntity(updatedLocation);
  }

  async remove(id: string): Promise<LocationEntity> {
    // Check if location exists first
    await this.findOne(id);

    // Use Prisma ORM for safe deletion
    const deletedLocation = await this.prisma.location.delete({
      where: { id },
    });

    return this.mapToLocationEntity(deletedLocation);
  }

  async findByType(type: LocationType): Promise<LocationEntity[]> {
    const locations = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Location" 
      WHERE "type" = ${type} AND "isActive" = true
      ORDER BY "name" ASC
    `;

    return locations.map((location) => this.mapToLocationEntity(location));
  }

  async findPopular(limit = 10): Promise<LocationEntity[]> {
    const locations = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "Location" 
      WHERE "isPopular" = true AND "isActive" = true
      ORDER BY "name" ASC
      LIMIT ${limit}
    `;

    return locations.map((location) => this.mapToLocationEntity(location));
  }

  // ==========================================
  // I18N + SEO ENHANCED METHODS FOR LOCATIONS
  // ==========================================

  /**
   * Find location with localized data
   */
  async findOneLocalized(
    id: string,
    language: string = 'vi',
  ): Promise<LocationEntity> {
    const location = await this.findOne(id);
    return this.localizeLocation(location, language);
  }

  /**
   * Find all locations with localized data
   */
  async findAllLocalized(
    language: string = 'vi',
    paginationDto: PaginationDto,
    filters?: LocationFilterDto,
  ): Promise<any> {
    const result = await this.findAllWithPagination(paginationDto, filters);

    return {
      ...result,
      data: result.data.map((location) =>
        this.localizeLocation(location, language),
      ),
    };
  }

  /**
   * Update location translations (using description field for now)
   */
  async updateTranslations(
    id: string,
    translations: any,
    userId: string,
  ): Promise<LocationEntity> {
    const currentLocation = await this.findOne(id);

    // Since Location doesn't have metadata field, we use description
    const localizedDescription =
      translations.description?.['vi'] || currentLocation.description;
    const localizedName = translations.name?.['vi'] || currentLocation.name;

    const updated = await this.update(id, {
      name: localizedName,
      description: localizedDescription,
    });

    console.log(`Updated translations for location ${id} by user ${userId}`);
    return updated;
  }

  /**
   * Auto-generate SEO data for location
   */
  async autoGenerateSEO(
    id: string,
    language: string = 'vi',
    userId: string,
  ): Promise<LocationEntity> {
    const location = await this.findOne(id);

    const name = location.name;
    const description =
      location.description || `${name} - ${location.city}, ${location.country}`;

    // Location entity doesn't have SEO fields, but we can return computed SEO data
    const localizedLocation = this.localizeLocation(location, language);

    // Add SEO data to the response
    (localizedLocation as any).seoData = {
      title: name,
      description: this.truncateText(description, 155),
      keywords: this.extractKeywords(name + ' ' + description, language),
      slug: this.generateSlug(name, language),
    };

    console.log(
      `Generated SEO for location ${id} in ${language} by user ${userId}`,
    );
    return localizedLocation;
  }

  /**
   * Generate sitemap for locations
   */
  async generateLocationSitemap(): Promise<string> {
    const locations = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM "Location" 
      WHERE "isActive" = true
    `;

    const languages = ['vi', 'en', 'ko'];
    const baseUrl = 'https://iccautotravel.com';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const location of locations) {
      for (const lang of languages) {
        const slug = this.generateSlug(location.name, lang);
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/${lang}/locations/${slug}</loc>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.6</priority>\n`;
        sitemap += '  </url>\n';
      }
    }

    sitemap += '</urlset>';
    return sitemap;
  }

  /**
   * Find featured locations by language
   */
  async findFeaturedByLanguage(
    language: string = 'vi',
    limit: number = 8,
  ): Promise<LocationEntity[]> {
    const locations = await this.findPopular(limit);
    return locations.map((location) =>
      this.localizeLocation(location, language),
    );
  }

  private localizeLocation(
    location: LocationEntity,
    language: string,
  ): LocationEntity {
    const localized = { ...location };

    // Add localized type name
    const typeNames: Record<string, Record<string, string>> = {
      vi: {
        CITY: 'Thành phố',
        PROVINCE: 'Tỉnh/Thành',
        DISTRICT: 'Quận/Huyện',
        AIRPORT: 'Sân bay',
        HOTEL: 'Khách sạn',
        ATTRACTION: 'Điểm tham quan',
        OTHER: 'Khác',
      },
      en: {
        CITY: 'City',
        PROVINCE: 'Province',
        DISTRICT: 'District',
        AIRPORT: 'Airport',
        HOTEL: 'Hotel',
        ATTRACTION: 'Attraction',
        OTHER: 'Other',
      },
      ko: {
        CITY: '도시',
        PROVINCE: '지방',
        DISTRICT: '구',
        AIRPORT: '공항',
        HOTEL: '호텔',
        ATTRACTION: '관광지',
        OTHER: '기타',
      },
    };

    // Add computed fields
    (localized as any).localizedTypeName =
      typeNames[language]?.[location.type] || location.type;
    (localized as any).currentLanguage = language;
    (localized as any).seoUrl =
      `/${language}/locations/${this.generateSlug(location.name, language)}`;
    (localized as any).coordinates =
      location.latitude && location.longitude
        ? { lat: location.latitude, lng: location.longitude }
        : null;

    return localized;
  }

  private generateSlug(text: string, language: string): string {
    if (!text) return '';

    // Vietnamese specific characters
    if (language === 'vi') {
      const vietnameseMap: Record<string, string> = {
        à: 'a',
        á: 'a',
        ạ: 'a',
        ả: 'a',
        ã: 'a',
        â: 'a',
        ầ: 'a',
        ấ: 'a',
        ậ: 'a',
        ẩ: 'a',
        ẫ: 'a',
        ă: 'a',
        ằ: 'a',
        ắ: 'a',
        ặ: 'a',
        ẳ: 'a',
        ẵ: 'a',
        è: 'e',
        é: 'e',
        ẹ: 'e',
        ẻ: 'e',
        ẽ: 'e',
        ê: 'e',
        ề: 'e',
        ế: 'e',
        ệ: 'e',
        ể: 'e',
        ễ: 'e',
        ì: 'i',
        í: 'i',
        ị: 'i',
        ỉ: 'i',
        ĩ: 'i',
        ò: 'o',
        ó: 'o',
        ọ: 'o',
        ỏ: 'o',
        õ: 'o',
        ô: 'o',
        ồ: 'o',
        ố: 'o',
        ộ: 'o',
        ổ: 'o',
        ỗ: 'o',
        ơ: 'o',
        ờ: 'o',
        ớ: 'o',
        ợ: 'o',
        ở: 'o',
        ỡ: 'o',
        ù: 'u',
        ú: 'u',
        ụ: 'u',
        ủ: 'u',
        ũ: 'u',
        ư: 'u',
        ừ: 'u',
        ứ: 'u',
        ự: 'u',
        ử: 'u',
        ữ: 'u',
        ỳ: 'y',
        ý: 'y',
        ỵ: 'y',
        ỷ: 'y',
        ỹ: 'y',
        đ: 'd',
      };

      text = text.toLowerCase();
      Object.keys(vietnameseMap).forEach((key) => {
        text = text.replace(new RegExp(key, 'g'), vietnameseMap[key]);
      });
    }

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractKeywords(text: string, language: string): string[] {
    const stopWords: Record<string, string[]> = {
      vi: [
        'của',
        'và',
        'tại',
        'với',
        'từ',
        'đến',
        'là',
        'có',
        'được',
        'cho',
        'trong',
        'trên',
      ],
      en: [
        'the',
        'and',
        'or',
        'but',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        'by',
      ],
      ko: [
        '의',
        '과',
        '와',
        '에',
        '에서',
        '로',
        '으로',
        '이',
        '가',
        '을',
        '를',
        '은',
        '는',
      ],
    };

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !(stopWords[language] || []).includes(word))
      .slice(0, 10);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
