import { PaymentRequest } from '../interfaces/payment-request.interface';
import { PaymentResponse } from '../interfaces/payment-response.interface';

export interface PaymentStrategy {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  verifyPayment(payload: any, query?: any): Promise<any>;
  getProvider(): string;
}
