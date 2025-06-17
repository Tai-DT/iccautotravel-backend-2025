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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverStatisticsService } from './driver-statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverFilterDto,
  ApproveDriverDto,
} from './dto/driver.dto';

@Controller('drivers')
export class DriverController {
  constructor(
    private driverService: DriverService,
    private driverStatisticsService: DriverStatisticsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filterDto: DriverFilterDto, @CurrentUser() user: any) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      minRating,
      specialties,
      languages,
      approvalStatus,
    } = filterDto;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Lọc theo đánh giá tối thiểu
    if (minRating !== undefined) {
      where.ratings = {
        avgRating: { gte: Number(minRating) },
      };
    }

    // Lọc theo chuyên môn
    if (specialties) {
      const specialtiesList = specialties.toString().split(',');
      where.specialties = {
        hasSome: specialtiesList,
      };
    }

    // Lọc theo ngôn ngữ
    if (languages) {
      const languagesList = languages.toString().split(',');
      where.languages = {
        hasSome: languagesList,
      };
    }

    // Lọc theo trạng thái duyệt - chỉ admin và staff mới được lọc theo trạng thái duyệt
    if (approvalStatus && (user.role === 'ADMIN' || user.role === 'STAFF')) {
      where.approvalStatus = approvalStatus;
    }

    // Lấy tổng số tài xế phù hợp điều kiện
    const totalCount = await this.driverService.countDrivers(where);

    // Lấy danh sách tài xế với phân trang, chỉ hiển thị tài xế đã duyệt cho khách hàng
    const drivers = await this.driverService.findAll({
      skip,
      take: limit,
      where,
      include: {
        ratings: true,
        statistics: true,
      },
      orderBy:
        filterDto.sortBy === 'rating'
          ? {
              ratings: {
                avgRating: filterDto.sortOrder === 'asc' ? 'asc' : 'desc',
              },
            }
          : {
              [filterDto.sortBy || 'createdAt']: filterDto.sortOrder || 'desc',
            },
      userRole: user.role, // Truyền vai trò người dùng để lọc kết quả
    });

    return {
      data: drivers,
      meta: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / limit),
      },
    };
  }

  @Get('pending-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async getPendingApprovalCount() {
    const count = await this.driverService.getPendingApprovalCount();
    return { count };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      // Truyền vai trò người dùng để kiểm tra quyền truy cập
      const driver = await this.driverService.findOne(
        id,
        {
          vehicleDrivers: {
            include: {
              vehicleServiceDetail: true,
            },
          },
          reviews: {
            where: { status: 'PUBLISHED' },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          ratings: true,
          statistics: true,
        },
        user.role,
      );

      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      return driver;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to retrieve driver',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async create(@Body() createDriverDto: CreateDriverDto) {
    try {
      const newDriver = await this.driverService.create({
        id: `driver_${Math.random().toString(36).substr(2, 9)}`,
        ...createDriverDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newDriver;
    } catch (error) {
      throw new HttpException(
        `Error creating driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    // Kiểm tra tài xế tồn tại
    const driver = await this.driverService.findOne(id);

    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }

    try {
      const updatedDriver = await this.driverService.update({
        where: { id },
        data: {
          ...updateDriverDto,
          updatedAt: new Date(),
        },
      });

      return updatedDriver;
    } catch (error) {
      throw new HttpException(
        `Error updating driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    // Kiểm tra tài xế tồn tại
    const driver = await this.driverService.findOne(id);

    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Thay vì xóa, chỉ đánh dấu là không hoạt động
      await this.driverService.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return { success: true, message: 'Driver deactivated successfully' };
    } catch (error) {
      throw new HttpException(
        `Error deleting driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard)
  async getDriverStatistics(@Param('id') id: string) {
    const driver = await this.driverService.findOne(id);

    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }

    const statistics =
      await this.driverStatisticsService.getDriverStatistics(id);

    return statistics;
  }

  @Get(':id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async generateReport(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const driver = await this.driverService.findOne(id);

    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }

    // Parse dates
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const report = await this.driverStatisticsService.generatePerformanceReport(
      id,
      start,
      end,
    );

    return report;
  }

  @Get('rankings/top')
  async getTopDrivers() {
    const topDrivers = await this.driverStatisticsService.getDriverRankings();
    return topDrivers;
  }

  @Post(':id/assign/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async assignDriverToBooking(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
  ) {
    // Kiểm tra tài xế và booking tồn tại
    const driver = await this.driverService.findOne(id);

    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }

    try {
      const booking = await this.driverService.assignDriverToBooking(
        id,
        bookingId,
      );
      return {
        success: true,
        message: 'Driver assigned successfully',
        booking,
      };
    } catch (error) {
      throw new HttpException(
        `Error assigning driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Thêm endpoint mới để duyệt tài xế
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async approveDriver(
    @Param('id') id: string,
    @Body() approveDto: ApproveDriverDto,
  ) {
    try {
      // Kiểm tra tài xế tồn tại
      const driver = await this.driverService.findOne(id);

      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      // Duyệt hoặc từ chối tài xế
      const result = await this.driverService.approveDriver(id, approveDto);

      return {
        success: true,
        message: `Driver ${approveDto.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        driver: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to approve driver',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
