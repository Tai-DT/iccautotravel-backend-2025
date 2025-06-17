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
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlogStatus } from '@prisma/client';
import { Request } from 'express';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(ValidationPipe) createBlogDto: CreateBlogDto,
    @Req() req: Request,
  ) {
    const authorId = (req.user as any)?.id;
    return this.blogService.create(createBlogDto, authorId);
  }

  @Get()
  findAll(
    @Query('status') status?: BlogStatus,
    @Query('lang') lang?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.blogService.findAll({
      status,
      lang,
      categoryId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBlogDto: UpdateBlogDto,
  ) {
    return this.blogService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  // Category endpoints
  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(
    @Body(ValidationPipe) createCategoryDto: CreateBlogCategoryDto,
  ) {
    return this.blogService.createCategory(createCategoryDto);
  }

  @Get('categories/all')
  findAllCategories(@Query('lang') lang?: string) {
    return this.blogService.findAllCategories(lang);
  }

  @Get('categories/:id')
  findCategoryById(@Param('id') id: string) {
    return this.blogService.findCategoryById(id);
  }
}
