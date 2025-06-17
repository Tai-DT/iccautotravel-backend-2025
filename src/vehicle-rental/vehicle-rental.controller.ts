import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VehicleRentalService } from './vehicle-rental.service';
import { PriceCalculationService } from './price-calculation.service';
import { KmPriceCalculationService } from './km-price-calculation.service';
import { CalculateRentalPriceDto } from './dto/calculate-price.dto';
import { CalculateRentalPriceByKmDto } from './dto/calculate-price-by-km.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  formatError,
  getErrorMessage,
  getErrorStack,
  logError,
} from '../utils/error-handler.util';

@ApiTags('Thuê xe')
@Controller('api/vehicle-rental')
export class VehicleRentalController {
  private readonly logger = new Logger(VehicleRentalController.name);

  constructor(
    private readonly vehicleRentalService: VehicleRentalService,
    private readonly priceCalculationService: PriceCalculationService,
    private readonly kmPriceCalculationService: KmPriceCalculationService,
  ) {}

  @Post('calc-price')
  @ApiOperation({ summary: 'Tính giá thuê xe' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async calculatePrice(
    @Body() data: CalculateRentalPriceDto,
    @CurrentUser() user: any,
  ) {
    try {
      const userId = user?.id;
      return await this.priceCalculationService.calculateRentalPrice(
        data,
        userId,
      );
    } catch (error) {
      logError(this.logger, 'Lỗi khi tính giá thuê xe', error);
      const formattedError = formatError(error, 'Lỗi khi tính giá thuê xe');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // API tính giá theo km
  @Post('calc-price-by-km')
  @ApiOperation({ summary: 'Tính giá thuê xe theo quãng đường (km)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async calculatePriceByKm(
    @Body() data: CalculateRentalPriceByKmDto,
    @CurrentUser() user: any,
  ) {
    try {
      const userId = user?.id;
      return await this.kmPriceCalculationService.calculateRentalPriceByKm(
        data,
        userId,
      );
    } catch (error) {
      logError(this.logger, 'Lỗi khi tính giá thuê xe theo km', error);
      const formattedError = formatError(
        error,
        'Lỗi khi tính giá thuê xe theo km',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Get('price-list')
  @ApiOperation({ summary: 'Lấy danh sách bảng giá thuê xe' })
  @ApiResponse({ status: 200, description: 'Danh sách bảng giá' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vehicleTypeId', required: false, type: String })
  @ApiQuery({ name: 'routeId', required: false, type: String })
  async getPriceList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('vehicleTypeId') vehicleTypeId?: string,
    @Query('routeId') routeId?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { isActive: true };

      if (vehicleTypeId) {
        where.vehicleTypeId = vehicleTypeId;
      }

      if (routeId) {
        where.routeId = routeId;
      }

      return await this.vehicleRentalService.findAllPrices({
        skip,
        take: Number(limit),
        where,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách bảng giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi lấy danh sách bảng giá',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Get('vehicle-types')
  @ApiOperation({ summary: 'Lấy danh sách loại xe' })
  @ApiResponse({ status: 200, description: 'Danh sách loại xe' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVehicleTypes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      return await this.vehicleRentalService.findAllVehicleTypes({
        skip,
        take: Number(limit),
        where: {},
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách loại xe: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi lấy danh sách loại xe',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Get('routes')
  @ApiOperation({ summary: 'Lấy danh sách tuyến đường' })
  @ApiResponse({ status: 200, description: 'Danh sách tuyến đường' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRoutes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      return await this.vehicleRentalService.findAllRoutes({
        skip,
        take: Number(limit),
        where: {},
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách tuyến đường: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi lấy danh sách tuyến đường',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Get('price-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Lấy lịch sử tính giá thuê xe' })
  @ApiResponse({ status: 200, description: 'Lịch sử tính giá' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getPriceLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
      }

      if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
      }

      return await this.vehicleRentalService.getPriceCalculationLogs({
        skip,
        take: Number(limit),
        where,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy lịch sử tính giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi lấy lịch sử tính giá');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // API để quản lý các cấu hình giá thuê xe
  @Get('config/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống theo key' })
  @ApiResponse({ status: 200, description: 'Thông tin cấu hình' })
  @ApiParam({ name: 'key', required: true, type: String })
  async getConfig(@Param('key') key: string) {
    try {
      return await this.vehicleRentalService.getConfig(key);
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy cấu hình: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi lấy cấu hình');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Put('config/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: 'Cấu hình đã được cập nhật' })
  @ApiParam({ name: 'key', required: true, type: String })
  async updateConfig(
    @Param('key') key: string,
    @Body() data: { value: string; description?: string },
  ) {
    try {
      return await this.vehicleRentalService.setConfig(key, data.value);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật cấu hình: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi cập nhật cấu hình');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // Các API quản lý cho Admin
  @Post('admin/vehicle-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo mới loại xe' })
  @ApiResponse({ status: 201, description: 'Loại xe đã được tạo' })
  async createVehicleType(@Body() data: any) {
    try {
      return await this.vehicleRentalService.createVehicleType({
        id: `vt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo loại xe: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tạo loại xe');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Post('admin/routes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo mới tuyến đường' })
  @ApiResponse({ status: 201, description: 'Tuyến đường đã được tạo' })
  async createRoute(@Body() data: any) {
    try {
      return await this.vehicleRentalService.createRoute({
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo tuyến đường: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tạo tuyến đường');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Post('admin/prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo mới bảng giá' })
  @ApiResponse({ status: 201, description: 'Bảng giá đã được tạo' })
  async createPrice(@Body() data: any) {
    try {
      return await this.vehicleRentalService.createPrice({
        id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo bảng giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tạo bảng giá');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Put('admin/vehicle-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật loại xe' })
  @ApiResponse({ status: 200, description: 'Loại xe đã được cập nhật' })
  @ApiParam({ name: 'id', required: true, type: String })
  async updateVehicleType(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.vehicleRentalService.updateVehicleType(id, data);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật loại xe: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi cập nhật loại xe');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Put('admin/routes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật tuyến đường' })
  @ApiResponse({ status: 200, description: 'Tuyến đường đã được cập nhật' })
  @ApiParam({ name: 'id', required: true, type: String })
  async updateRoute(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.vehicleRentalService.updateRoute(id, data);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật tuyến đường: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi cập nhật tuyến đường');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Put('admin/prices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật bảng giá' })
  @ApiResponse({ status: 200, description: 'Bảng giá đã được cập nhật' })
  @ApiParam({ name: 'id', required: true, type: String })
  async updatePrice(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.vehicleRentalService.updatePrice(id, data);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật bảng giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi cập nhật bảng giá');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Delete('admin/vehicle-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa loại xe' })
  @ApiResponse({ status: 200, description: 'Loại xe đã được xóa' })
  @ApiParam({ name: 'id', required: true, type: String })
  async deleteVehicleType(@Param('id') id: string) {
    try {
      await this.vehicleRentalService.deleteVehicleType(id);
      return { success: true, message: 'Loại xe đã được xóa thành công' };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa loại xe: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi xóa loại xe');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Delete('admin/routes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa tuyến đường' })
  @ApiResponse({ status: 200, description: 'Tuyến đường đã được xóa' })
  @ApiParam({ name: 'id', required: true, type: String })
  async deleteRoute(@Param('id') id: string) {
    try {
      await this.vehicleRentalService.deleteRoute(id);
      return { success: true, message: 'Tuyến đường đã được xóa thành công' };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa tuyến đường: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi xóa tuyến đường');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Delete('admin/prices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa bảng giá' })
  @ApiResponse({ status: 200, description: 'Bảng giá đã được xóa' })
  @ApiParam({ name: 'id', required: true, type: String })
  async deletePrice(@Param('id') id: string) {
    try {
      await this.vehicleRentalService.deletePrice(id);
      return { success: true, message: 'Bảng giá đã được xóa thành công' };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa bảng giá: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi xóa bảng giá');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // API quản lý đơn giá theo km
  @Get('km-price-list')
  @ApiOperation({ summary: 'Lấy danh sách đơn giá theo km' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn giá theo km' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'vehicleTypeId', required: false, type: String })
  @ApiQuery({ name: 'region', required: false, type: String })
  async getKmPriceList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('vehicleTypeId') vehicleTypeId?: string,
    @Query('region') region?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { isActive: true };

      if (vehicleTypeId) {
        where.vehicleTypeId = vehicleTypeId;
      }

      if (region) {
        where.region = region;
      }

      return await this.vehicleRentalService.findAllKmPrices({
        skip,
        take: Number(limit),
        where,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách đơn giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi lấy danh sách đơn giá theo km',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // API lấy lịch sử tính giá theo km
  @Get('km-price-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Lấy lịch sử tính giá thuê xe theo km' })
  @ApiResponse({ status: 200, description: 'Lịch sử tính giá theo km' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getKmPriceLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
      }

      if (endDate) {
        where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
      }

      return await this.vehicleRentalService.getKmPriceCalculationLogs({
        skip,
        take: Number(limit),
        where,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy lịch sử tính giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi lấy lịch sử tính giá theo km',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  // API quản lý đơn giá theo km cho Admin
  @Post('admin/km-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo mới đơn giá theo km' })
  @ApiResponse({ status: 201, description: 'Đơn giá theo km đã được tạo' })
  async createKmPrice(@Body() data: any, @CurrentUser() user: any) {
    try {
      return await this.vehicleRentalService.createKmPrice({
        id: `kmprice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdBy: user?.id,
      });
    } catch (error) {
      this.logger.error(
        `Lỗi khi tạo đơn giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi tạo đơn giá theo km');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Put('admin/km-prices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật đơn giá theo km' })
  @ApiResponse({ status: 200, description: 'Đơn giá theo km đã được cập nhật' })
  @ApiParam({ name: 'id', required: true, type: String })
  async updateKmPrice(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.vehicleRentalService.updateKmPrice(id, data);
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật đơn giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(
        error,
        'Lỗi khi cập nhật đơn giá theo km',
      );
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }

  @Delete('admin/km-prices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa đơn giá theo km' })
  @ApiResponse({ status: 200, description: 'Đơn giá theo km đã được xóa' })
  @ApiParam({ name: 'id', required: true, type: String })
  async deleteKmPrice(@Param('id') id: string) {
    try {
      await this.vehicleRentalService.deleteKmPrice(id);
      return {
        success: true,
        message: 'Đơn giá theo km đã được xóa thành công',
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa đơn giá theo km: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      const formattedError = formatError(error, 'Lỗi khi xóa đơn giá theo km');
      throw new HttpException(formattedError.message, formattedError.status);
    }
  }
}
