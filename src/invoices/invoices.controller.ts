import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string) {
    // TODO: Lấy signed url PDF
    return this.invoicesService.getSignedUrl(id);
  }
}
