import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ObjectType, Field, Float } from '@nestjs/graphql';
import { I18nBookingService } from '../services/i18n-booking.service';
import { CreateI18nBookingDto } from '../dto/create-i18n-booking.dto';
import { I18nLang } from '../decorators/i18n-lang.decorator';

@ObjectType()
export class LocalizedBooking {
  @Field()
  id!: string;

  @Field()
  customerName!: string;

  @Field()
  customerEmail!: string;

  @Field()
  customerPhone!: string;

  @Field()
  serviceType!: string;

  @Field()
  localizedServiceType!: string;

  @Field()
  bookingDate!: string;

  @Field()
  destination!: string;

  @Field()
  localizedDestination!: string;

  @Field()
  status!: string;

  @Field()
  localizedStatus!: string;

  @Field(() => Float, { nullable: true })
  totalAmount?: number;

  @Field()
  currency!: string;

  @Field()
  formattedAmount!: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
export class OptionItem {
  @Field()
  value!: string;

  @Field()
  label!: string;
}

@ObjectType()
export class BookingOptions {
  @Field(() => [OptionItem])
  statusOptions!: OptionItem[];

  @Field(() => [OptionItem])
  serviceTypeOptions!: OptionItem[];

  @Field(() => [OptionItem])
  paymentMethodOptions!: OptionItem[];

  @Field(() => [OptionItem])
  popularDestinations!: OptionItem[];
}

@Resolver()
export class BookingI18nResolver {
  constructor(private readonly bookingService: I18nBookingService) {}

  @Mutation(() => LocalizedBooking)
  createLocalizedBooking(
    @Args('input') input: CreateI18nBookingDto,
    @I18nLang() lang: string,
  ): LocalizedBooking {
    const booking = this.bookingService.createBooking(input, lang);

    return {
      ...booking,
      formattedAmount: this.bookingService.formatAmount(
        booking.totalAmount || 0,
        lang,
      ),
    };
  }

  @Query(() => LocalizedBooking, { nullable: true })
  getLocalizedBooking(
    @Args('id') id: string,
    @I18nLang() lang: string,
  ): LocalizedBooking | null {
    const booking = this.bookingService.getBookingById(id, lang);
    if (!booking) return null;

    return {
      ...booking,
      formattedAmount: this.bookingService.formatAmount(
        booking.totalAmount || 0,
        lang,
      ),
    };
  }

  @Mutation(() => LocalizedBooking)
  updateBookingStatus(
    @Args('id') id: string,
    @Args('status') status: string,
    @I18nLang() lang: string,
  ): LocalizedBooking {
    const booking = this.bookingService.updateBookingStatus(id, status, lang);

    return {
      ...booking,
      formattedAmount: this.bookingService.formatAmount(
        booking.totalAmount || 0,
        lang,
      ),
    };
  }

  @Query(() => BookingOptions)
  getBookingOptions(@I18nLang() lang: string): BookingOptions {
    return {
      statusOptions: this.bookingService.getBookingStatusOptions(lang),
      serviceTypeOptions: this.bookingService.getServiceTypeOptions(lang),
      paymentMethodOptions: this.bookingService.getPaymentMethodOptions(lang),
      popularDestinations: this.bookingService.getPopularDestinations(lang),
    };
  }

  @Query(() => [OptionItem])
  getStatusOptions(@I18nLang() lang: string): OptionItem[] {
    return this.bookingService.getBookingStatusOptions(lang);
  }

  @Query(() => [OptionItem])
  getServiceTypes(@I18nLang() lang: string): OptionItem[] {
    return this.bookingService.getServiceTypeOptions(lang);
  }

  @Query(() => [OptionItem])
  getPaymentMethods(@I18nLang() lang: string): OptionItem[] {
    return this.bookingService.getPaymentMethodOptions(lang);
  }

  @Query(() => [OptionItem])
  getDestinations(@I18nLang() lang: string): OptionItem[] {
    return this.bookingService.getPopularDestinations(lang);
  }

  @Query(() => String)
  formatPrice(
    @Args('amount', { type: () => Float }) amount: number,
    @I18nLang() lang: string,
  ): string {
    return this.bookingService.formatAmount(amount, lang);
  }
}
