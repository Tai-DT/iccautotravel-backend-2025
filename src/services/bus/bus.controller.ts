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
} from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('buses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('busType') busType?: string,
    @Query('route') route?: string,
  ) {
    return this.busService.findAllWithFilters({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      status,
      busType,
      route,
    });
  }

  @Get('stats')
  @Roles('ADMIN', 'STAFF')
  getStats() {
    return this.busService.getStats();
  }

  @Get('routes')
  @Roles('ADMIN', 'STAFF')
  getRoutes() {
    return this.busService.getPopularRoutes();
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF')
  findOne(@Param('id') id: string) {
    return this.busService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.busService.remove(id);
  }

  @Get('route/:origin/:destination')
  @Roles('ADMIN', 'STAFF', 'CUSTOMER')
  findByRoute(
    @Param('origin') origin: string,
    @Param('destination') destination: string,
    @Query('date') date?: string,
  ) {
    return this.busService.findByRoute(origin, destination, date);
  }

  @Get(':id/availability/:date')
  @Roles('ADMIN', 'STAFF', 'CUSTOMER')
  getAvailability(@Param('id') id: string, @Param('date') date: string) {
    return this.busService.findAvailableSeats(id, date);
  }
}
