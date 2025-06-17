import { Injectable } from '@nestjs/common';
// import { TranslationService } from './i18n/translation.service'; // Disabled to fix I18n issues

@Injectable()
export class AppService {
  constructor() {}

  getHello(lang?: string): string {
    return 'Hello! Welcome to ICCautoTravel API!';
  }

  getLocalizedMessage(key: string, lang?: string): string {
    return key; // Simple mock implementation
  }
}
