import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as moment from 'moment';
import {
  PaymentStrategy,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
} from '../interfaces/payment-strategy.interface';

@Injectable()
export class VnpayStrategy implements PaymentStrategy {
  private readonly vnpUrl: string;
  private readonly vnpTmnCode: string;
  private readonly vnpHashSecret: string;
  private readonly vnpReturnUrl: string;

  constructor(private configService: ConfigService) {
    this.vnpUrl =
      this.configService.get<string>('payment.vnpay.url') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnpTmnCode =
      this.configService.get<string>('payment.vnpay.tmnCode') || '';
    this.vnpHashSecret =
      this.configService.get<string>('payment.vnpay.hashSecret') || '';
    this.vnpReturnUrl =
      this.configService.get<string>('payment.vnpay.returnUrl') || '';
  }

  getProvider(): string {
    return 'VNPAY';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const createDate = moment().format('YYYYMMDDHHmmss');
      const orderId = request.orderId;
      const amount = request.amount * 100; // VNPay uses amount in cents
      const orderInfo = request.description || 'Thanh toán dịch vụ du lịch';
      const orderType = 'other';
      const locale = 'vn';
      const currCode = 'VND';
      const vnp_Version = '2.1.0';
      const vnp_Command = 'pay';

      const vnp_Params: Record<string, string> = {
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: this.vnpTmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: amount.toString(),
        vnp_ReturnUrl: request.returnUrl || this.vnpReturnUrl,
        vnp_IpAddr: '127.0.0.1',
        vnp_CreateDate: createDate,
      };

      // Sort parameters
      const sortedParams = Object.keys(vnp_Params).sort();
      let signData = '';

      for (const key of sortedParams) {
        if (vnp_Params[key]) {
          signData += key + '=' + vnp_Params[key] + '&';
        }
      }

      signData = signData.slice(0, -1); // Remove last &

      const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
      const secureHash = hmac
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
      vnp_Params['vnp_SecureHash'] = secureHash;

      // Build payment URL
      const queryString = new URLSearchParams(vnp_Params).toString();
      const paymentUrl = `${this.vnpUrl}?${queryString}`;

      return Promise.resolve({
        success: true,
        paymentUrl,
        transactionId: orderId,
        data: vnp_Params,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        transactionId: request.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async verifyPayment(data: any): Promise<PaymentVerification> {
    try {
      const vnp_Params = { ...data };
      const secureHash = vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      // Sort parameters
      const sortedParams = Object.keys(
        vnp_Params as Record<string, any>,
      ).sort();
      let signData = '';

      for (const key of sortedParams) {
        if (vnp_Params[key]) {
          signData += key + '=' + vnp_Params[key] + '&';
        }
      }

      signData = signData.slice(0, -1); // Remove last &

      const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
      const checkSum = hmac
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

      const isValidSignature = secureHash === checkSum;
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const transactionId = vnp_Params['vnp_TxnRef'];
      const amount = parseInt(vnp_Params['vnp_Amount'] as string) / 100; // Convert back from cents

      let status: 'PAID' | 'FAILED' | 'PENDING' = 'FAILED';
      if (isValidSignature && responseCode === '00') {
        status = 'PAID';
      } else if (responseCode === '24') {
        status = 'PENDING';
      }

      return Promise.resolve({
        success: isValidSignature && responseCode === '00',
        transactionId,
        amount,
        status,
        data: vnp_Params,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        transactionId: data.vnp_TxnRef || 'unknown',
        amount: 0,
        status: 'FAILED' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
