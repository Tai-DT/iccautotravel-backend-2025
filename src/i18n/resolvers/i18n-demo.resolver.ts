import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { TranslationService } from '../translation.service';
import { CreateI18nBookingDto } from '../dto/create-i18n-booking.dto';
import { I18nLang } from '../decorators/i18n-lang.decorator';
import { SupportedLanguage } from '../enums/supported-language.enum';

@ObjectType()
export class BookingExample {
  @Field()
  id!: string;

  @Field()
  customerName!: string;

  @Field()
  customerEmail!: string;

  @Field()
  serviceType!: string;

  @Field()
  localizedServiceType!: string;

  @Field()
  status!: string;

  @Field()
  localizedStatus!: string;

  @Field()
  bookingDate!: string;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType()
export class LocalizedText {
  @Field()
  key!: string;

  @Field()
  english!: string;

  @Field()
  vietnamese!: string;

  @Field()
  korean!: string;
}

@ObjectType()
export class I18nDemoResponse {
  @Field()
  message!: string;

  @Field()
  language!: string;

  @Field(() => [LocalizedText])
  examples!: LocalizedText[];
}

@Resolver()
export class I18nDemoResolver {
  constructor(private readonly translationService: TranslationService) {}

  @Query(() => I18nDemoResponse)
  i18nDemo(@I18nLang() lang: string): I18nDemoResponse {
    const examples: LocalizedText[] = [
      {
        key: 'common.welcome',
        english: this.translationService.translateWithLang(
          'common.welcome',
          'en',
        ),
        vietnamese: this.translationService.translateWithLang(
          'common.welcome',
          'vi',
        ),
        korean: this.translationService.translateWithLang(
          'common.welcome',
          'ko',
        ),
      },
      {
        key: 'services.service_types.car_rental',
        english: this.translationService.translateWithLang(
          'services.service_types.car_rental',
          'en',
        ),
        vietnamese: this.translationService.translateWithLang(
          'services.service_types.car_rental',
          'vi',
        ),
        korean: this.translationService.translateWithLang(
          'services.service_types.car_rental',
          'ko',
        ),
      },
      {
        key: 'services.status.confirmed',
        english: this.translationService.translateWithLang(
          'services.status.confirmed',
          'en',
        ),
        vietnamese: this.translationService.translateWithLang(
          'services.status.confirmed',
          'vi',
        ),
        korean: this.translationService.translateWithLang(
          'services.status.confirmed',
          'ko',
        ),
      },
    ];

    return {
      message: this.translationService.translateWithLang(
        'common.welcome',
        lang,
      ),
      language: lang,
      examples,
    };
  }

  @Query(() => [String])
  getServiceTypes(@I18nLang() lang: string): string[] {
    const serviceTypes = [
      'car_rental',
      'hotel_booking',
      'flight_booking',
      'tour_package',
    ];
    return serviceTypes.map((type) =>
      this.translationService.getServiceTypeName(type, lang),
    );
  }

  @Query(() => [String])
  getStatusOptions(@I18nLang() lang: string): string[] {
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    return statuses.map((status) =>
      this.translationService.getStatusText(status, lang),
    );
  }

  @Mutation(() => BookingExample)
  createBookingExample(
    @Args('input') input: CreateI18nBookingDto,
    @I18nLang() lang: string,
  ): BookingExample {
    // This is just a demo - in real implementation, you'd save to database
    const mockBooking: BookingExample = {
      id: 'booking-' + Date.now(),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      serviceType: input.serviceType,
      localizedServiceType: this.translationService.getServiceTypeName(
        input.serviceType,
        lang,
      ),
      status: 'pending',
      localizedStatus: this.translationService.getStatusText('pending', lang),
      bookingDate: input.bookingDate,
      notes: input.notes,
    };

    return mockBooking;
  }

  @Query(() => [LocalizedText])
  getAllTranslationKeys(): LocalizedText[] {
    const commonKeys = [
      'welcome',
      'hello',
      'thank_you',
      'goodbye',
      'yes',
      'no',
    ];

    return commonKeys.map((key) => ({
      key: `common.${key}`,
      english: this.translationService.translateWithLang(`common.${key}`, 'en'),
      vietnamese: this.translationService.translateWithLang(
        `common.${key}`,
        'vi',
      ),
      korean: this.translationService.translateWithLang(`common.${key}`, 'ko'),
    }));
  }

  @Query(() => String)
  translateKey(
    @Args('key') key: string,
    @Args('lang', { type: () => SupportedLanguage, nullable: true })
    lang?: SupportedLanguage,
  ): string {
    const language = lang || SupportedLanguage.EN;
    return this.translationService.translateWithLang(key, language);
  }
}
