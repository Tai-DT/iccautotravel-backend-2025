import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PaymentStrategy } from './payment-strategy.interface';
import { PaymentRequest } from '../interfaces/payment-request.interface';
import { PaymentResponse } from '../interfaces/payment-response.interface';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MomoStrategy implements PaymentStrategy {
  private readonly momoConfig: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.momoConfig = this.configService.get('payment.momo');
  }

  getProvider(): string {
    return 'MOMO';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const requestId = request.orderId;
      const orderId = request.orderId;
      const amount = request.amount;
      const orderInfo = request.description;
      const redirectUrl = request.returnUrl;
      const ipnUrl = this.momoConfig.ipnUrl;
      const partnerCode = this.momoConfig.partnerCode;
      const accessKey = this.momoConfig.accessKey;
      const secretKey = this.momoConfig.secretKey;
      const lang = 'vi'; // Hardcode language to Vietnamese
      const requestType = 'payWithMethod';
      const autoCapture = true;
      const extraData = request.metadata
        ? JSON.stringify(request.metadata)
        : '';

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode,
        partnerName: 'ICCautoTravel', // This might need to be configurable
        storeId: 'MomoTestStore', // This might need to be configurable
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        signature,
      };

      const { data } = await firstValueFrom(
        this.httpService.post(this.momoConfig.endpoint, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (data.resultCode === 0) {
        return {
          success: true,
          paymentUrl: data.payUrl,
          transactionId: data.orderId,
          metadata: {
            deeplink: data.deeplink,
            qrCodeUrl: data.qrCodeUrl,
          },
          data: data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Payment creation failed',
          status: 'FAILED',
          data: data,
        };
      }
    } catch (error) {
      console.error('MomoStrategy createPayment error:', error);
      return {
        success: false,
        message: 'Payment creation failed',
        status: 'FAILED',
      };
    }
  }

  async verifyPayment(payload: any): Promise<PaymentResponse> {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
      } = payload;

      const rawSignature = `accessKey=${this.momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const expectedSignature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

      if (signature !== expectedSignature) {
        return {
          success: false,
          message: 'Invalid signature',
          status: 'FAILED',
        };
      }

      if (resultCode === 0) {
        return {
          success: true,
          status: 'PAID',
          transactionId: orderId,
          amount: amount,
          gatewayTransactionId: transId,
          message: message,
          paidAt: new Date(responseTime),
          metadata: {
            partnerCode,
            requestId,
            orderInfo,
            orderType,
            payType,
            extraData,
          },
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          message: message || 'Payment verification failed',
          data: payload,
        };
      }
    } catch (error) {
      console.error('MomoStrategy verifyPayment error:', error);
      return {
        success: false,
        message: 'Payment verification failed',
        status: 'FAILED',
      };
    }
  }
}
