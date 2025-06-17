import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewsletterStatus } from '@prisma/client';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  subscribe(@Body(ValidationPipe) createNewsletterDto: CreateNewsletterDto) {
    return this.newsletterService.subscribe(createNewsletterDto);
  }

  @Post('unsubscribe')
  unsubscribe(@Body('email') email: string) {
    return this.newsletterService.unsubscribe(email);
  }

  @Get('unsubscribe/:email')
  unsubscribeByEmail(@Param('email') email: string) {
    return this.newsletterService.unsubscribe(email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: NewsletterStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsletterService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  getStatistics() {
    return this.newsletterService.getStatistics();
  }

  @Get('subscribers/active')
  @UseGuards(JwtAuthGuard)
  getActiveSubscribers(
    @Query('languages') languages?: string,
    @Query('topics') topics?: string,
  ) {
    const preferences: any = {};
    if (languages) preferences.languages = languages.split(',');
    if (topics) preferences.topics = topics.split(',');

    return this.newsletterService.getActiveSubscribers(preferences);
  }

  @Get(':email')
  findOne(@Param('email') email: string) {
    return this.newsletterService.findOne(email);
  }

  @Patch(':email')
  updatePreferences(
    @Param('email') email: string,
    @Body(ValidationPipe) updateNewsletterDto: UpdateNewsletterDto,
  ) {
    return this.newsletterService.updatePreferences(email, updateNewsletterDto);
  }
}
