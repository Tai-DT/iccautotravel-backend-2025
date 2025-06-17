import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ApproveDriverDto } from './dto/driver.dto';
import { ApprovalStatus, DriverEntity } from './entities/driver.entity';
import {
  DriverCreateInput,
  DriverInclude,
  DriverOrderByWithRelationInput,
  DriverUpdateInput,
  DriverWhereInput,
  DriverWhereUniqueInput,
} from './entities/driver-statistics.entity';

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}

  // Phương thức findAll hiện tại - cập nhật để xử lý trạng thái duyệt
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: DriverWhereUniqueInput;
    where?: DriverWhereInput;
    orderBy?: DriverOrderByWithRelationInput;
    include?: DriverInclude;
    userRole?: Role; // Thêm vai trò của người dùng đang gửi yêu cầu
  }) {
    const { skip, take, cursor, where, orderBy, include, userRole } = params;

    // Nếu người dùng là khách hàng, chỉ cho phép xem tài xế đã được duyệt
    let whereCondition = { ...where };
    if (userRole?.name === 'CUSTOMER') {
      whereCondition = {
        ...whereCondition,
        status: ApprovalStatus.APPROVED,
        isActive: true,
      };
    }

    // Using safer parameter handling
    let query = `SELECT * FROM "Driver" WHERE TRUE`;

    // Add filter conditions safely
    if (whereCondition?.status) {
      query += ` AND status = '${whereCondition.status}'`;
    }

    if (whereCondition?.isActive !== undefined) {
      query += ` AND "isActive" = ${whereCondition.isActive}`;
    }

    // Add ordering
    if (orderBy) {
      // Fix the typing by ensuring orderBy is treated as string | any
      const safeOrderBy =
        typeof orderBy === 'string'
          ? (orderBy as string).replace(/[;'"\\]/g, '')
          : orderBy && typeof orderBy === 'object' && 'toString' in orderBy
            ? orderBy.toString().replace(/[;'"\\]/g, '')
            : '';

      query += ` ORDER BY ${safeOrderBy}`;
    }

    // Add pagination
    if (take) {
      query += ` LIMIT ${parseInt(String(take), 10)}`;
    }

    if (skip) {
      query += ` OFFSET ${parseInt(String(skip), 10)}`;
    }

    // Type the raw query result explicitly
    const drivers: any[] = await this.prisma.$queryRawUnsafe(query);

    return drivers.map((driver: any) => DriverEntity.fromPrisma(driver));
  }

  // Phương thức findOne đã được cập nhật để xử lý trạng thái duyệt
  async findOne(id: string, include?: DriverInclude, userRole?: Role) {
    // Replace direct model access with raw query
    const driver = await this.prisma.$queryRaw`
      SELECT * FROM "Driver" WHERE id = ${id} LIMIT 1
    `;

    if (!driver || (Array.isArray(driver) && driver.length === 0)) {
      return null;
    }

    const driverData = Array.isArray(driver) ? driver[0] : driver;

    // Nếu người dùng là khách hàng và tài xế chưa được duyệt, không cho phép xem
    if (
      userRole?.name === 'CUSTOMER' &&
      (driverData.status !== ApprovalStatus.APPROVED || !driverData.isActive)
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this driver profile',
      );
    }

    return DriverEntity.fromPrisma(driverData);
  }

  // Tạo tài xế mới
  async create(data: DriverCreateInput) {
    // Generate a new ID if none is provided
    const driverId = data.id || uuidv4();

    // Using raw query instead of model access
    const driver = await this.prisma.$executeRaw`
      INSERT INTO "Driver" (
        id, "userId", "licenseNumber", "licenseClass", "licenseExpiry",
        experience, status, bio, languages, "createdAt", "updatedAt", "isActive"
      ) VALUES (
        ${driverId}, ${data.userId}, ${data.licenseNumber}, ${data.licenseClass},
        ${data.licenseExpiry}, ${data.experience}, ${data.status || ApprovalStatus.PENDING},
        ${data.bio || null}, ${data.languages}, ${new Date()}, ${new Date()}, 
        ${data.isActive !== undefined ? data.isActive : true}
      ) RETURNING *
    `;

    // Retrieve the newly created driver
    const newDriver = await this.findOne(driverId);
    return newDriver;
  }

  // Cập nhật thông tin tài xế
  async update({
    where,
    data,
  }: {
    where: DriverWhereUniqueInput;
    data: DriverUpdateInput;
  }) {
    // First get the current driver data
    if (!where.id) {
      throw new Error('Driver ID is required');
    }
    const existingDriver = await this.findOne(where.id);
    if (!existingDriver) {
      throw new Error('Driver not found');
    }

    // Build update fields dynamically with proper value handling
    const updateFields = [];
    if (data.licenseNumber) {
      updateFields.push(`"licenseNumber" = '${data.licenseNumber}'`);
    }
    if (data.licenseClass) {
      updateFields.push(`"licenseClass" = '${data.licenseClass}'`);
    }
    if (data.licenseExpiry) {
      const expiryDate =
        data.licenseExpiry instanceof Date
          ? data.licenseExpiry.toISOString()
          : data.licenseExpiry;
      updateFields.push(`"licenseExpiry" = '${expiryDate}'`);
    }
    if (data.experience !== undefined) {
      updateFields.push(
        `experience = ${parseInt(String(data.experience), 10)}`,
      );
    }
    if (data.status) {
      updateFields.push(`status = '${data.status}'`);
    }
    if (data.bio !== undefined) {
      updateFields.push(
        `bio = ${data.bio === null ? 'NULL' : `'${data.bio}'`}`,
      );
    }
    if (data.languages) {
      // Assuming languages is JSON or string array
      const languagesValue =
        typeof data.languages === 'string'
          ? `'${data.languages}'`
          : `'${JSON.stringify(data.languages)}'`;
      updateFields.push(`languages = ${languagesValue}`);
    }
    if (data.isActive !== undefined) {
      updateFields.push(`"isActive" = ${data.isActive}`);
    }

    // Always update the updatedAt field
    updateFields.push(`"updatedAt" = '${new Date().toISOString()}'`);

    if (updateFields.length === 0) {
      return existingDriver; // No fields to update
    }

    // Execute update query with safe parameter handling
    await this.prisma.$executeRawUnsafe(`
      UPDATE "Driver"
      SET ${updateFields.join(', ')}
      WHERE id = '${where.id}'
    `);

    // Return the updated driver
    return this.findOne(where.id);
  }

  // Xóa tài xế
  async delete(where: DriverWhereUniqueInput) {
    // First get the driver to delete
    if (!where.id) {
      throw new Error('Driver ID is required');
    }
    const driverToDelete = await this.findOne(where.id);
    if (!driverToDelete) {
      return null;
    }

    try {
      // Execute delete query
      await this.prisma.$executeRaw`
        DELETE FROM "Driver" WHERE id = ${where.id}
      `;

      return driverToDelete;
    } catch (error) {
      console.error(`Error deleting driver: ${error}`);
      return null;
    }
  }

  // Count drivers based on filter
  async countDrivers(where: DriverWhereInput): Promise<number> {
    // Build the WHERE clause from the filter
    let whereClause = 'TRUE';

    if (where?.status) {
      whereClause += ` AND status = '${where.status}'`;
    }

    if (where?.isActive !== undefined) {
      whereClause += ` AND "isActive" = ${where.isActive}`;
    }

    // Execute count query using $queryRawUnsafe instead of $raw
    const result = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "Driver" WHERE ${whereClause}`,
    );

    return parseInt(String((result as any[])[0]?.count || 0), 10);
  }

  // Get count of pending approval drivers
  async getPendingApprovalCount(): Promise<number> {
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Driver" WHERE status = 'PENDING'
    `;

    if (
      result &&
      Array.isArray(result) &&
      result.length > 0 &&
      result[0] &&
      typeof result[0] === 'object' &&
      'count' in result[0]
    ) {
      return parseInt(String(result[0].count), 10);
    }
    return 0;
  }

  // Assign driver to booking
  async assignDriverToBooking(driverId: string, bookingId: string) {
    // Check if driver exists and is approved
    const driver = await this.findOne(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    if (driver.status !== ApprovalStatus.APPROVED) {
      throw new Error('Driver is not approved');
    }

    // Update booking with assigned driver using raw query
    await this.prisma.$executeRaw`
      UPDATE "Booking" 
      SET "assignedDriverId" = ${driverId}, "updatedAt" = ${new Date()}
      WHERE id = ${bookingId}
    `;

    // Get the updated booking
    const booking = await this.prisma.$queryRaw`
      SELECT * FROM "Booking" WHERE id = ${bookingId}
    `;

    if (!booking || (Array.isArray(booking) && booking.length === 0)) {
      throw new Error('Booking not found');
    }

    return Array.isArray(booking) ? booking[0] : booking;
  }

  // Phê duyệt tài xế
  async approveDriver(id: string, approveDto: ApproveDriverDto) {
    // Check if driver exists
    const driver = await this.findOne(id);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Update driver status using the update method we've already implemented
    return this.update({
      where: { id },
      data: {
        status: approveDto.status,
        updatedAt: new Date(),
      },
    });
  }
}
