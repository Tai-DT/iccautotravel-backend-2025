import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicePdfService {
  async generate(invoice: any): Promise<Buffer> {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${invoice.id}`);
    doc.text(`Booking ID: ${invoice.bookingId}`);
    doc.text(`Type: ${invoice.type}`);
    doc.text(`Amount: ${invoice.amount}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Issued At: ${invoice.issuedAt || ''}`);
    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}
