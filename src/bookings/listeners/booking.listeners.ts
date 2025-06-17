import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingCreatedEvent } from '../events/booking.events';

@Injectable()
export class BookingListeners {
  @OnEvent('booking.created')
  handleBookingCreated(event: BookingCreatedEvent) {
    // TODO: Gửi mail, push notify, ...
    console.log('Booking created event received:', event.booking);
  }
}
