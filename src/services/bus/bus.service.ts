import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { ServiceType } from '@prisma/client';

@Injectable()
export class BusService {
  constructor(private prisma: PrismaService) {}

  async create(createBusDto: CreateBusDto) {
    const { name, description, isActive = true, ...busDetails } = createBusDto;

    // Use unchecked create to bypass required fields
    return this.prisma.service.create({
      data: {
        name,
        description: description || null,
        type: ServiceType.BUS,
        isActive,
        metadata: busDetails,
        isDeleted: false,
        audioFileMaleId: null,
        audioFileFemaleId: null,
      } as any,
    });
  }

  async findAll() {
    return this.prisma.service.findMany({
      where: {
        type: ServiceType.BUS,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateBusDto: UpdateBusDto) {
    return this.prisma.service.update({
      where: { id },
      data: updateBusDto,
    });
  }

  async remove(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  async findByRoute(origin: string, destination: string, date?: string) {
    return this.prisma.service.findMany({
      where: {
        type: ServiceType.BUS,
        isActive: true,
        // Add route-specific filtering based on metadata
      },
      include: {
        BusServiceDetail: true,
      },
    });
  }

  async findAvailableSeats(busId: string, date: string) {
    // Logic to calculate available seats for a specific bus on a date
    const bus = await this.findOne(busId);
    // Return available seat calculation
    return {
      busId,
      date,
      availableSeats: 40, // Example
      totalSeats: 45,
    };
  }

  async findAllWithFilters(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    busType?: string;
    route?: string;
  }) {
    const { page, limit, search, status, busType, route } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      type: ServiceType.BUS,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.isActive = status === 'ACTIVE';
    }

    const [buses, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          BusServiceDetail: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: buses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const [totalBuses, activeBuses] = await Promise.all([
      this.prisma.service.count({
        where: { type: ServiceType.BUS },
      }),
      this.prisma.service.count({
        where: { type: ServiceType.BUS, isActive: true },
      }),
    ]);

    // Get unique routes count from metadata
    const busesWithRoutes = await this.prisma.service.findMany({
      where: { type: ServiceType.BUS },
      select: { metadata: true },
    });

    const uniqueRoutes = new Set(
      busesWithRoutes
        .map((bus) => {
          const metadata = bus.metadata as any;
          return metadata?.route;
        })
        .filter((route) => route),
    );

    return {
      totalBuses,
      activeBuses,
      inactiveBuses: totalBuses - activeBuses,
      totalRoutes: uniqueRoutes.size,
      avgOccupancy: 75.5, // Mock data
      totalRevenue: 2500000000, // Mock data
    };
  }

  async getPopularRoutes() {
    // Mock data for popular routes
    return [
      { route: 'Hà Nội - TP.HCM', count: 45 },
      { route: 'Hà Nội - Đà Nẵng', count: 32 },
      { route: 'TP.HCM - Đà Lạt', count: 28 },
      { route: 'Hà Nội - Hải Phòng', count: 25 },
      { route: 'TP.HCM - Cần Thơ', count: 22 },
    ];
  }
}
