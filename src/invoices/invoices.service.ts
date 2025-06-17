import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PrismaService } from '../prisma/prisma.service';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    // Tạo một đối tượng dữ liệu tương thích với schema Prisma
    const data = {
      id: uuidv4(),
      bookingId: createInvoiceDto.bookingId,
      type: createInvoiceDto.type,
      amount: createInvoiceDto.amount,
      updatedAt: new Date(),
      status: createInvoiceDto.status
        ? (createInvoiceDto.status as InvoiceStatus)
        : InvoiceStatus.DRAFT,
      invoiceCode: `Invoice#${Date.now()}`, // Use invoiceCode field which exists in schema
    };

    const invoice = await this.prisma.invoice.create({
      data,
    });
    return invoice;
  }

  generatePdf(invoice: any) {
    // TODO: Logic sinh PDF bằng pdfkit
    // For now, return a mock PDF buffer for testing
    const mockPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(Invoice #${invoice.id})Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
0000000182 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
272
%%EOF`;
    return Buffer.from(mockPdfContent);
  }

  async findAll() {
    return this.prisma.invoice.findMany();
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async getPdfUrl(id: string) {
    const invoice = await this.findOne(id);

    const pdfUrl = invoice.pdfUrl;

    if (!pdfUrl) {
      // If no URL exists, generate PDF and save URL
      this.generatePdf(invoice); // Generate PDF (not used directly here)
      const mockPdfUrl = `https://example.com/invoices/${id}.pdf`;

      // Update invoice with the new PDF URL
      await this.prisma.invoice.update({
        where: { id },
        data: {
          pdfUrl: mockPdfUrl, // Use pdfUrl field directly
        },
      });

      return mockPdfUrl;
    }

    return pdfUrl;
  }

  async getSignedUrl(id: string) {
    await this.findOne(id); // Verify invoice exists
    return this.getPdfUrl(id);
  }

  async sendInvoiceEmail(invoice: any, toEmail: string, pdfBuffer?: Buffer) {
    // Cấu hình transporter cho Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.BREVO_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.BREVO_FROM_EMAIL || 'no-reply@yourdomain.com',
      to: toEmail,
      subject: `Invoice #${invoice.id}`,
      text: `Xin chào,\n\nHóa đơn của bạn đã được phát hành.\nSố tiền: ${invoice.amount}\nTrạng thái: ${invoice.status}`,
      attachments: pdfBuffer
        ? [
            {
              filename: `invoice-${invoice.id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : [],
    };
    await transporter.sendMail(mailOptions);
    return true;
  }
}
