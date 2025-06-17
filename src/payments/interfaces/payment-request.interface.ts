export interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  returnUrl: string;
  cancelUrl?: string;
  description: string;
  metadata?: any;
  customerInfo?: CustomerInfo;
  ipAddress?: string;
  userId?: string;
  bookingId?: string;
}
