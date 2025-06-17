import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { BlogStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BlogEntity } from './entities/blog.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createBlogDto: CreateBlogDto,
    authorId: string,
  ): Promise<BlogEntity> {
    try {
      const { categoryId, ...rest } = createBlogDto;

      // Convert slug
      const slug = this.generateSlug(createBlogDto.title);

      // Kiểm tra slug đã tồn tại chưa
      await this.checkSlugExists(slug);

      // Tạo một bản ghi blog mới
      const data: Prisma.BlogCreateInput = {
        id: uuidv4(), // Add id field which is required by Prisma schema
        ...rest,
        slug,
        updatedAt: new Date(),
        User: {
          connect: { id: authorId }, // Sử dụng connect để liên kết với User
        },
      };

      // Nếu có categoryId, liên kết với category
      if (categoryId) {
        data.BlogCategory = { connect: { id: categoryId } };
      }

      // Tạo blog và lấy kèm thông tin user
      const createdBlog = await this.prisma.blog.create({
        data,
      });

      // Lấy thông tin author từ id và chuyển đổi sang UserEntity
      const authorData = await this.prisma.user.findUnique({
        where: { id: authorId },
      });

      const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

      // Trả về kết quả với thông tin author
      return {
        ...createdBlog,
        author,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Lỗi khi tạo bài viết mới: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async findAll(
    filters: {
      status?: BlogStatus;
      lang?: string;
      categoryId?: string;
      page?: number;
      limit?: number;
      search?: string;
    } = {},
  ) {
    const { page = 1, limit = 10, search, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...whereFilters,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const blogs = await this.prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const blogsWithAuthors = await Promise.all(
      blogs.map(async (blog) => {
        const authorData = await this.prisma.user.findUnique({
          where: { id: blog.authorId },
        });
        const author = authorData
          ? UserEntity.fromPrisma(authorData)
          : undefined;
        return {
          ...blog,
          author,
        };
      }),
    );

    const total = await this.prisma.blog.count({ where });

    return {
      data: blogsWithAuthors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<BlogEntity> {
    try {
      // Tìm blog theo ID
      const blog = await this.prisma.blog.findUnique({
        where: { id },
      });

      // Kiểm tra blog tồn tại
      if (!blog) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
      }

      // Lấy thông tin author
      const authorData = await this.prisma.user.findUnique({
        where: { id: blog.authorId },
      });

      const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

      // Trả về kết quả với author
      return {
        ...blog,
        author,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new NotFoundException(`Lỗi khi tìm bài viết: ${errorMessage}`);
    }
  }

  async findBySlug(slug: string): Promise<BlogEntity> {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const authorData = await this.prisma.user.findUnique({
      where: { id: blog.authorId },
    });

    const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

    return {
      ...blog,
      author,
    };
  }

  async update(id: string, updateBlogDto: UpdateBlogDto): Promise<BlogEntity> {
    try {
      const existingBlog = await this.findOne(id); // Ensures blog exists

      const { categoryId, title, status, ...restOfBlogContent } = updateBlogDto;

      const data: Prisma.BlogUpdateInput = {
        ...restOfBlogContent,
        updatedAt: new Date(),
      };

      // Update slug if title changed
      if (title !== undefined && title !== existingBlog.title) {
        data.title = title; // Assign title back to data
        data.slug = this.generateSlug(title);
        // Check if new slug already exists for a different blog post
        if (data.slug) {
          const existingBlogBySlug = await this.prisma.blog.findFirst({
            where: { slug: data.slug, NOT: { id } },
          });
          if (existingBlogBySlug) {
            throw new BadRequestException(
              'Another blog with the generated title/slug already exists.',
            );
          }
        }
      }

      // Set publishedAt if status changed to PUBLISHED and not already set
      if (status !== undefined) {
        data.status = status; // Assign status back to data
        if (status === BlogStatus.PUBLISHED && !existingBlog.publishedAt) {
          data.publishedAt = new Date();
        }
      }

      // Xử lý categoryId
      if (categoryId === null) {
        data.BlogCategory = { disconnect: true };
      } else if (categoryId) {
        data.BlogCategory = { connect: { id: categoryId } };
      }

      const updatedBlog = await this.prisma.blog.update({
        where: { id },
        data,
      });

      // Lấy thông tin author
      const authorData = await this.prisma.user.findUnique({
        where: { id: updatedBlog.authorId },
      });

      const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

      // Trả về kết quả với author
      return {
        ...updatedBlog,
        author,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Lỗi khi cập nhật bài viết: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async remove(id: string): Promise<BlogEntity> {
    await this.findOne(id); // Check if exists

    const updatedBlog = await this.prisma.blog.update({
      where: { id },
      data: { status: BlogStatus.ARCHIVED },
    });

    const authorData = await this.prisma.user.findUnique({
      where: { id: updatedBlog.authorId },
    });
    const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

    return {
      ...updatedBlog,
      author,
    };
  }

  // Blog Categories
  async createCategory(createCategoryDto: CreateBlogCategoryDto) {
    const slug = this.generateSlug(createCategoryDto.name);

    const existingCategory = await this.prisma.blogCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    const now = new Date();
    const newId = uuidv4();

    return this.prisma.blogCategory.create({
      data: {
        id: newId,
        ...createCategoryDto,
        slug,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async findAllCategories(lang?: string) {
    // Create a properly typed where condition
    const where: Prisma.BlogCategoryWhereInput = {};

    // Loại bỏ bộ lọc lang vì BlogCategory không có trường lang
    // if (lang) {
    //   where.lang = lang;
    // }

    return this.prisma.blogCategory.findMany({
      where,
      include: {
        _count: {
          select: { Blog: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        Blog: {
          where: { status: 'PUBLISHED' },
          // Temporarily comment out author include due to schema mismatch
          // include: {
          //   author: { select: { id: true, fullName: true, email: true, role: true, createdAt: true, updatedAt: true } }
          // },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // Helper methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private async checkSlugExists(slug: string): Promise<void> {
    const existingBlogBySlug = await this.prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlogBySlug) {
      throw new BadRequestException('Blog with this title already exists');
    }
  }

  // ==========================================
  // I18N + SEO ENHANCED METHODS FOR BLOG
  // ==========================================

  /**
   * Find blog with localized data
   */
  async findOneLocalized(
    id: string,
    language: string = 'vi',
  ): Promise<BlogEntity> {
    const blog = await this.findOne(id);
    return this.localizeBlog(blog, language);
  }

  /**
   * Auto-generate SEO data for blog
   */
  async autoGenerateSEO(
    id: string,
    language: string = 'vi',
    userId: string,
  ): Promise<BlogEntity> {
    const blog = await this.findOne(id);

    const name = blog.title;
    const description = blog.excerpt || blog.content.substring(0, 200);

    const seoData = {
      title: name,
      description: this.truncateText(description, 155),
    };

    const updatedBlog = await this.prisma.blog.update({
      where: { id },
      data: {
        seoTitle: seoData.title,
        seoDescription: seoData.description,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Updated SEO for blog ${id} by user ${userId}`);

    const authorData = await this.prisma.user.findUnique({
      where: { id: updatedBlog.authorId },
    });
    const author = authorData ? UserEntity.fromPrisma(authorData) : undefined;

    return { ...updatedBlog, author };
  }

  /**
   * Generate audio for blog
   */
  async generateBlogAudio(
    id: string,
    language: string = 'vi',
    userId: string,
  ): Promise<void> {
    const blog = await this.findOne(id);

    const audioId = `audio_${id}_${language}_${Date.now()}`;

    await this.prisma.blog.update({
      where: { id },
      data: {
        audioFileMaleId: audioId + '_male',
        audioFileFemaleId: audioId + '_female',
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Generated audio for blog ${id} in ${language} by user ${userId}`,
    );
  }

  private localizeBlog(blog: BlogEntity, language: string): BlogEntity {
    const localized = { ...blog };

    (localized as any).currentLanguage = language;
    (localized as any).seoUrl = `/${language}/blog/${blog.slug}`;
    (localized as any).hasSEO = !!(blog.seoTitle && blog.seoDescription);
    (localized as any).hasAudio = !!(
      blog.audioFileMaleId || blog.audioFileFemaleId
    );

    return localized;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
