import { BookingEntity } from '../entities/booking.entity';

export class BookingCreatedEvent {
  constructor(public readonly booking: BookingEntity) {}
}
