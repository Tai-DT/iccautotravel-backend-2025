import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Logger,
} from '@nestjs/common';
import { ZaloService } from './zalo.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('zalo')
export class ZaloController {
  private readonly logger = new Logger(ZaloController.name);
  private readonly zaloSecretKey: string | undefined;
  private readonly isEnabled: boolean = false;

  constructor(
    private readonly zaloService: ZaloService,
    private readonly configService: ConfigService,
  ) {
    try {
      this.zaloSecretKey = this.configService.get<string>('ZALO_SECRET_KEY');
      
      if (!this.zaloSecretKey) {
        this.logger.warn('Zalo webhook handling is disabled: Missing ZALO_SECRET_KEY configuration');
        this.isEnabled = false;
      } else {
        this.isEnabled = true;
        this.logger.log('Zalo webhook handling is enabled');
      }
    } catch (error) {
      this.logger.warn(`Zalo webhook handling is disabled: Error during initialization - ${error instanceof Error ? error.message : String(error)}`);
      this.isEnabled = false;
      // Set a default value for zaloSecretKey to avoid undefined errors
      this.zaloSecretKey = '';
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() data: any,
    @Headers('x-zalo-timestamp') timestamp: string,
    @Headers('x-zalo-signature') signature: string,
  ) {
    this.logger.log(`Received Zalo webhook: ${JSON.stringify(data)}`);

    // Check if Zalo integration is enabled
    if (!this.isEnabled || !this.zaloSecretKey) {
      this.logger.warn('Zalo webhook handling is disabled. Skipping verification.');
      return { message: 'Webhook received but processing is disabled' };
    }

    if (!timestamp || !signature) {
      this.logger.warn('Missing X-Zalo-Timestamp or X-Zalo-Signature header.');
      return { message: 'Missing required headers' };
    }

    const hmac = crypto.createHmac('sha256', this.zaloSecretKey);
    hmac.update(`${timestamp}${JSON.stringify(data)}`);
    const calculatedSignature = hmac.digest('hex');

    if (calculatedSignature !== signature) {
      this.logger.error('Invalid Zalo signature.');
      // Trả về 200 OK để tránh Zalo gửi lại nhiều lần, nhưng không xử lý request
      return { message: 'Invalid signature' };
    }

    this.logger.log('Zalo signature verified. Processing message...');
    await this.zaloService.handleZaloMessage(data);
    return { message: 'Webhook received and processed' };
  }
}
