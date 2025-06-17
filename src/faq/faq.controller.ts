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
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(ValidationPipe) createFaqDto: CreateFaqDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;
    return this.faqService.create(createFaqDto, userId);
  }

  @Get()
  findAll(
    @Query('lang') lang?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.faqService.findAll({
      lang,
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('categories')
  findCategories(@Query('lang') lang?: string) {
    return this.faqService.findCategories(lang);
  }

  @Get('category/:category')
  findByCategory(
    @Param('category') category: string,
    @Query('lang') lang?: string,
  ) {
    return this.faqService.findByCategory(category, lang);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFaqDto: UpdateFaqDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;
    return this.faqService.update(id, updateFaqDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.faqService.remove(id);
  }

  @Patch('reorder/all')
  @UseGuards(JwtAuthGuard)
  reorder(@Body('ids') ids: string[]) {
    return this.faqService.reorder(ids);
  }
}
