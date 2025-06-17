import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompanyInfoService } from './company-info.service';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, User } from '@prisma/client';

// Thêm interface cho file upload nếu không có Express.Multer.File
interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@Controller('company-info')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyInfoController {
  constructor(private readonly companyInfoService: CompanyInfoService) {}

  @Post()
  @Roles('ADMIN', 'STAFF')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PNG, JPEG, JPG files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createCompanyInfoDto: CreateCompanyInfoDto,
    @CurrentUser() user: User,
    @UploadedFile() logo?: UploadedFileType,
  ) {
    return this.companyInfoService.create(createCompanyInfoDto);
  }

  @Get()
  findAll() {
    return this.companyInfoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyInfoService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PNG, JPEG, JPG files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateCompanyInfoDto: UpdateCompanyInfoDto,
    @CurrentUser() user: User,
    @UploadedFile() logo?: UploadedFileType,
  ) {
    return this.companyInfoService.update(id, updateCompanyInfoDto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'STAFF')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.companyInfoService.remove(id, user.id);
  }
}
