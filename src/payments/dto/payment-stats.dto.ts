import { ApiProperty } from '@nestjs/swagger';
import { PaymentEntity } from '../entities/payment.entity';

export class PaymentStatsDto {
  @ApiProperty({ description: 'Total count of payments' })
  totalCount: number = 0;

  @ApiProperty({ description: 'Count of pending payments' })
  pendingCount: number = 0;

  @ApiProperty({ description: 'Count of paid payments' })
  paidCount: number = 0;

  @ApiProperty({ description: 'Total amount of all paid payments' })
  totalAmount: number = 0;

  @ApiProperty({ description: 'Recent payments', type: [PaymentEntity] })
  recentPayments: PaymentEntity[] = [];
}
