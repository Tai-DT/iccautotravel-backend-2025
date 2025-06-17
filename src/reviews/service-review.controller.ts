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
import { ServiceReviewService } from './service-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateServiceReviewDto,
  UpdateServiceReviewDto,
  ServiceReviewFilterDto,
} from './dto/service-review.dto';
import { ReviewStatus } from './dto/service-review.dto';

@Controller('reviews/services')
export class ServiceReviewController {
  constructor(private serviceReviewService: ServiceReviewService) {}

  @Get()
  async findAll(@Query() filterDto: ServiceReviewFilterDto) {
    const {
      page = 1,
      limit = 10,
      serviceId,
      userId,
      status,
      minRating,
      sortBy,
      sortOrder,
    } = filterDto;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện lọc
    const where: any = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    } else {
      // Mặc định chỉ hiển thị các đánh giá đã được duyệt
      where.status = ReviewStatus.APPROVED;
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    // Lấy tổng số đánh giá phù hợp điều kiện
    const totalCount = await this.serviceReviewService.count(where);

    // Validate sortBy parameter to prevent invalid column names
    const validSortFields = ['createdAt', 'updatedAt', 'rating', 'id'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Lấy danh sách đánh giá với phân trang
    const reviews = await this.serviceReviewService.findAll({
      skip,
      take: limit,
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        service: true, // Include the whole service object
      },
      orderBy: { [validSortBy]: sortOrder || 'desc' },
    });

    return {
      data: reviews,
      meta: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / limit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.serviceReviewService.findOne(id, {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      service: true,
    });

    if (!review) {
      throw new HttpException('Review not found', HttpStatus.NOT_FOUND);
    }

    return review;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createReviewDto: CreateServiceReviewDto,
    @CurrentUser() user: any,
  ) {
    // Kiểm tra xem người dùng có thể đánh giá dịch vụ này không
    const { canReview, reason } =
      await this.serviceReviewService.canReviewService(
        user.id,
        createReviewDto.serviceId,
        createReviewDto.bookingId,
      );

    if (!canReview) {
      throw new HttpException(
        reason || 'Không thể đánh giá dịch vụ này',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      // Tạo đánh giá mới (mặc định ở trạng thái chờ duyệt)
      const newReview = await this.serviceReviewService.create({
        id: `review_${Math.random().toString(36).substr(2, 9)}`,
        rating: createReviewDto.rating,
        title: createReviewDto.title,
        comment: createReviewDto.comment,
        photos: createReviewDto.photos || [],
        usageDate: createReviewDto.usageDate,
        status: ReviewStatus.PENDING, // Mặc định là chờ duyệt

        service: { connect: { id: createReviewDto.serviceId } },
        user: { connect: { id: user.id } },
        ...(createReviewDto.bookingId
          ? { booking: { connect: { id: createReviewDto.bookingId } } }
          : {}),
      });

      return {
        success: true,
        message: 'Đánh giá của bạn đã được gửi và đang chờ được duyệt',
        review: newReview,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi khi tạo đánh giá: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateServiceReviewDto,
    @CurrentUser() user: any,
  ) {
    // Kiểm tra đánh giá tồn tại
    const review = await this.serviceReviewService.findOne(id);

    if (!review) {
      throw new HttpException('Đánh giá không tìm thấy', HttpStatus.NOT_FOUND);
    }

    // Chỉ cho phép người tạo đánh giá hoặc admin/staff cập nhật
    const isOwner = review.userId === user.id;
    const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(user.role);

    if (!isOwner && !isAdminOrStaff) {
      throw new HttpException(
        'Bạn không có quyền cập nhật đánh giá này',
        HttpStatus.FORBIDDEN,
      );
    }

    // Người dùng thông thường chỉ có thể cập nhật một số trường
    const allowedUserFields = [
      'rating',
      'title',
      'comment',
      'photos',
      'usageDate',
    ];
    const updateData: Record<string, any> = { ...updateReviewDto };

    if (isOwner && !isAdminOrStaff) {
      // Nếu người dùng thông thường cập nhật, xóa các trường không được phép
      Object.keys(updateData).forEach((key) => {
        if (!allowedUserFields.includes(key)) {
          delete updateData[key];
        }
      });
      // Đặt lại trạng thái về PENDING khi người dùng cập nhật
      updateData.status = ReviewStatus.PENDING;
    }

    try {
      const updatedReview = await this.serviceReviewService.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: isAdminOrStaff
          ? 'Đánh giá đã được cập nhật thành công'
          : 'Đánh giá của bạn đã được cập nhật và đang chờ được duyệt lại',
        review: updatedReview,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi khi cập nhật đánh giá: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    // Kiểm tra đánh giá tồn tại
    const review = await this.serviceReviewService.findOne(id);

    if (!review) {
      throw new HttpException('Đánh giá không tìm thấy', HttpStatus.NOT_FOUND);
    }

    // Chỉ cho phép người tạo đánh giá hoặc admin xóa
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      throw new HttpException(
        'Bạn không có quyền xóa đánh giá này',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      await this.serviceReviewService.delete({ id });
      return { success: true, message: 'Đánh giá đã được xóa thành công' };
    } catch (error) {
      throw new HttpException(
        `Lỗi khi xóa đánh giá: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async approveReview(
    @Param('id') id: string,
    @Body() { status }: { status: ReviewStatus },
  ) {
    // Kiểm tra đánh giá tồn tại
    const review = await this.serviceReviewService.findOne(id);

    if (!review) {
      throw new HttpException('Đánh giá không tìm thấy', HttpStatus.NOT_FOUND);
    }

    try {
      const updatedReview = await this.serviceReviewService.update({
        where: { id },
        data: { status },
      });

      return {
        success: true,
        message: `Đánh giá đã được ${status === ReviewStatus.APPROVED ? 'duyệt' : 'từ chối'} thành công`,
        review: updatedReview,
      };
    } catch (error) {
      throw new HttpException(
        `Lỗi khi duyệt đánh giá: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('service/:serviceId')
  async getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    // Kiểm tra dịch vụ có tồn tại không
    const service = await this.serviceReviewService.getServiceRating(serviceId);

    if (!service) {
      throw new HttpException('Dịch vụ không tìm thấy', HttpStatus.NOT_FOUND);
    }

    // Lấy đánh giá của dịch vụ
    const skip = (page - 1) * limit;
    const reviews = await this.serviceReviewService.findServiceReviews(
      serviceId,
      ReviewStatus.APPROVED,
      { skip, take: limit },
    );

    // Lấy tổng số đánh giá để phân trang
    const totalCount = await this.serviceReviewService.count({
      serviceId,
      status: ReviewStatus.APPROVED,
    });

    // Lấy thông tin rating tổng hợp
    const rating = await this.serviceReviewService.getServiceRating(serviceId);

    return {
      data: reviews,
      rating,
      meta: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / limit),
      },
    };
  }

  @Get('check/:serviceId')
  @UseGuards(JwtAuthGuard)
  async checkCanReview(
    @Param('serviceId') serviceId: string,
    @Query('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.serviceReviewService.canReviewService(
      user.id,
      serviceId,
      bookingId,
    );
  }

  @Get('top-rated/:limit')
  async getTopRatedServices(@Param('limit') limit = 10) {
    return this.serviceReviewService.getBestRatedServices(+limit);
  }
}
