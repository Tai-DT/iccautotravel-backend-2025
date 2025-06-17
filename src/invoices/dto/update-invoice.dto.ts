import { IsString, IsOptional } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;
}
