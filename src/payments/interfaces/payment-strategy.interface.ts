export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  returnUrl: string;
  cancelUrl: string;
  description: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  // Additional fields for tests
  userId?: string;
  bookingId?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId: string;
  data?: any;
  error?: string;
  // Additional fields for tests
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerification {
  success: boolean;
  transactionId: string;
  amount: number;
  status: 'PAID' | 'FAILED' | 'PENDING';
  data?: any;
  error?: string;
  // Additional fields for tests
  message?: string;
  gatewayTransactionId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStrategy {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(data: any): Promise<PaymentVerification>;
  getProvider(): string;
}
