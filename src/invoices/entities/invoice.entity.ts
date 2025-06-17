export class InvoiceEntity {
  id!: string;
  bookingId!: string;
  type!: string;
  amount!: number;
  pdfUrl?: string;
  status!: string;
  issuedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
