import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { I18nValidationConstraint } from './validators/i18n-validation.constraint';
import { I18nExceptionFilter } from './filters/i18n-exception.filter';
import { I18nResolver } from './i18n.resolver';
import { I18nDemoResolver } from './resolvers/i18n-demo.resolver';
import { I18nBookingService } from './services/i18n-booking.service';
import { BookingI18nResolver } from './resolvers/booking-i18n.resolver';
import { FrontendI18nService } from './services/frontend-i18n.service';
import { FrontendI18nResolver } from './resolvers/frontend-i18n.resolver';
import { FrontendI18nController } from './controllers/frontend-i18n.controller';
import { ConfigModule } from '@nestjs/config';
import { MockI18nService } from './mock-i18n.service';
import { LanguageInterceptor } from './interceptors/language.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MultilingualService } from './services/multilingual.service';
import { MultilingualDemoController } from './controllers/multilingual-demo.controller';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    MockI18nService,
    TranslationService,
    I18nValidationConstraint,
    I18nExceptionFilter,
    I18nResolver,
    I18nDemoResolver,
    I18nBookingService,
    BookingI18nResolver,
    FrontendI18nService,
    FrontendI18nResolver,
    MultilingualService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LanguageInterceptor,
    }
  ],
  controllers: [FrontendI18nController, MultilingualDemoController],
  exports: [
    TranslationService, 
    FrontendI18nService, 
    MockI18nService,
    MultilingualService
  ],
})
export class I18nModule {}

// Export I18nModule as I18nCustomModule for backward compatibility
export { I18nModule as I18nCustomModule };
