import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Query('lang') lang?: string): string {
    return this.appService.getHello(lang);
  }

  @Get('translate')
  getTranslation(
    @Query('key') key: string,
    @Query('lang') lang?: string,
  ): string {
    return this.appService.getLocalizedMessage(key, lang);
  }
}
