export interface PaymentResponse {
  success: boolean;
  error?: string;
  paymentUrl?: string;
  data?: any;
  transactionId?: string;
  gatewayTransactionId?: string;
  metadata?: any;
  message?: string;
  status?: string;
  amount?: number;
  paidAt?: Date;
}
