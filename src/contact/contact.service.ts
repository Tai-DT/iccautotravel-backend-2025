import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto, userId?: string) {
    const now = new Date();
    const newId = uuidv4();

    // Tạo dữ liệu cơ bản phù hợp với schema
    const baseData: any = {
      id: newId,
      name: createContactDto.name,
      email: createContactDto.email,
      phone: createContactDto.phone || null,
      subject: createContactDto.subject,
      message: createContactDto.message,
      status: 'NEW' as ContactStatus, // Thay thế cho isRead (giả định status là trường hợp lệ)
      createdAt: now,
      updatedAt: now,
    };

    // Nếu có userId, liên kết với user
    if (userId) {
      baseData.userId = userId;
    }

    const data = baseData as Prisma.ContactCreateInput;

    return this.prisma.contact.create({
      data,
    });
  }

  async findAll(filters: {
    status?: string; // Thay thế isRead bằng status
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, page = 1, limit = 10, search } = filters;
    const skip = (page - 1) * limit;
    const where: Prisma.ContactWhereInput = {};

    if (status !== undefined) {
      where.status = status as ContactStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          subject: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    handlerId?: string,
  ) {
    await this.findOne(id); // Check if exists

    const data: any = {
      ...updateContactDto,
      updatedAt: new Date(),
    };

    // Nếu đang cập nhật trạng thái và có handlerId
    if (updateContactDto.status !== undefined && handlerId) {
      data.userId = handlerId; // Thay thế handlerId bằng userId
    }

    return this.prisma.contact.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getStatistics() {
    const [total, newCount, inProgressCount, resolvedCount] = await Promise.all(
      [
        this.prisma.contact.count(),
        this.prisma.contact.count({
          where: { status: 'NEW' as ContactStatus },
        }),
        this.prisma.contact.count({
          where: { status: 'IN_PROGRESS' as ContactStatus },
        }),
        this.prisma.contact.count({
          where: { status: 'RESOLVED' as ContactStatus },
        }),
      ],
    );

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentCount = await this.prisma.contact.count({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    return {
      total,
      byStatus: {
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
      last30Days: recentCount,
    };
  }
}
