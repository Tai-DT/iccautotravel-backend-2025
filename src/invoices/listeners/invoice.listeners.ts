import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoicesService } from '../invoices.service';

@Injectable()
export class InvoiceListeners {
  constructor(private readonly invoicesService: InvoicesService) {}

  @OnEvent('booking.confirmed')
  async handleBookingConfirmed(event: { bookingId: string; amount: number }) {
    // Tạo invoice khi booking được xác nhận
    await this.invoicesService.create({
      bookingId: event.bookingId,
      type: 'VAT', // hoặc lấy từ event nếu có
      amount: event.amount,
      status: 'ISSUED', // Fixed: Use uppercase enum value
    });
  }

  @OnEvent('invoice.created')
  handleInvoiceCreated(event: any) {
    // TODO: Gửi mail, push notify, ...
    console.log('Invoice created event received:', event.invoice);
  }
}
