import { ApiProperty } from '@nestjs/swagger';
import { PaymentEntity } from '../entities/payment.entity';

class PaginationMeta {
  @ApiProperty()
  total: number = 0;

  @ApiProperty()
  page: number = 1;

  @ApiProperty()
  limit: number = 10;

  @ApiProperty()
  totalPages: number = 0;
}

export class PaginatedPaymentResultDto {
  @ApiProperty({ type: [PaymentEntity] })
  data: PaymentEntity[] = [];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta = new PaginationMeta();
}
