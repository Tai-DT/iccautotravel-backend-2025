import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is installed
import { DatabaseException } from '../common/exceptions/database.exception';

@Injectable()
export class CompanyInfoService {
  private readonly logger = new Logger(CompanyInfoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyInfoDto: CreateCompanyInfoDto) {
    this.logger.log(`Creating company info: ${createCompanyInfoDto.name}`);
    try {
      // Check if company info with this language already exists
      const existing = await this.prisma.companyInfo.findFirst({
        where: { lang: createCompanyInfoDto.lang },
      });

      if (existing) {
        throw new ConflictException(
          `Company info for language "${createCompanyInfoDto.lang}" already exists`,
        );
      }

      const now = new Date();
      const newId = uuidv4();

      // Create a data object with only the fields that exist in the Prisma schema
      const data: Prisma.CompanyInfoCreateInput = {
        id: newId,
        key: `company-${newId.substring(0, 8)}`, // Generate a key since it doesn't exist in the DTO
        title: createCompanyInfoDto.name || '',
        content: createCompanyInfoDto.description || '',
        lang: createCompanyInfoDto.lang || 'vi',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create the company info
      const companyInfo = await this.prisma.companyInfo.create({
        data,
      });

      return companyInfo;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : 'No stack trace',
      );
      throw new DatabaseException(
        `Failed to create company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async findAll() {
    this.logger.log('Finding all company info');
    try {
      return this.prisma.companyInfo.findMany({
        orderBy: { title: 'asc' }, // Using title which exists in the schema
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to find company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : 'No stack trace',
      );
      throw new DatabaseException(
        `Failed to find company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  async findOne(id: string) {
    this.logger.log(`Finding company info with ID: ${id}`);
    const companyInfo = await this.prisma.companyInfo.findUnique({
      where: { id },
    });

    if (!companyInfo) {
      throw new NotFoundException('Company information not found');
    }

    return companyInfo;
  }

  async update(
    id: string,
    updateCompanyInfoDto: UpdateCompanyInfoDto,
    userId?: string, // Made optional
    // file?: Express.Multer.File, // Appears unused for CompanyInfo
  ) {
    this.logger.log(
      `Updating company info with ID: ${id}, DTO: ${JSON.stringify(updateCompanyInfoDto)}, UserID: ${userId}`,
    );
    await this.findOne(id); // Check if exists

    const data: Prisma.CompanyInfoUpdateInput = {
      ...updateCompanyInfoDto,
      updatedAt: new Date(),
    };

    const companyInfo = await this.prisma.companyInfo.update({
      where: { id },
      data,
    });

    return companyInfo;
  }

  async remove(id: string, userId?: string /* Made optional */) {
    this.logger.log(`Removing company info with ID: ${id}, UserID: ${userId}`);
    await this.findOne(id); // Check if exists

    return this.prisma.companyInfo.update({
      where: { id },
      data: { isActive: false } as any, // Cast to any
    });
  }
}
