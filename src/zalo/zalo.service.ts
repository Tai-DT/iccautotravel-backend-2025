import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name);
  private readonly zaloAccessToken: string | undefined;
  private readonly zaloOAId: string | undefined;
  private readonly isEnabled: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    try {
      this.zaloAccessToken = this.configService.get<string>('ZALO_ACCESS_TOKEN');
      this.zaloOAId = this.configService.get<string>('ZALO_OA_ID');
      
      if (!this.zaloAccessToken || !this.zaloOAId) {
        this.logger.warn('Zalo integration is disabled: Missing ZALO_ACCESS_TOKEN or ZALO_OA_ID configuration');
        this.isEnabled = false;
      } else {
        this.isEnabled = true;
        this.logger.log('Zalo integration is enabled');
      }
    } catch (error) {
      this.logger.warn(`Zalo integration is disabled: Error during initialization - ${error instanceof Error ? error.message : String(error)}`);
      this.isEnabled = false;
    }
  }

  /**
   * Check if Zalo integration is enabled
   */
  isZaloEnabled(): boolean {
    return this.isEnabled;
  }

  async handleZaloMessage(data: any): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('Zalo integration is disabled. Cannot handle message.');
      return;
    }
    
    this.logger.log(`Handling Zalo message: ${JSON.stringify(data)}`);
    // Implement your chatbot logic here
    // Example: Echo back the user's message
    const senderId = data.sender.id;
    const messageText = data.message.text;

    if (messageText) {
      await this.sendZaloMessage(senderId, `Bạn đã nói: ${messageText}`);
    }
  }

  async sendZaloMessage(recipientId: string, message: string): Promise<any> {
    if (!this.isEnabled) {
      this.logger.warn('Zalo integration is disabled. Cannot send message.');
      return { success: false, message: 'Zalo integration is disabled' };
    }
    
    const url = 'https://openapi.zalo.me/v2.0/oa/message';
    const headers = {
      'Content-Type': 'application/json',
      access_token: this.zaloAccessToken,
    };
    const body = {
      recipient: {
        oa_id: this.zaloOAId,
        user_id: recipientId,
      },
      message: {
        text: message,
      },
    };

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      this.logger.log(`Zalo message sent: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        this.logger.error(`Failed to send Zalo message: ${error.message}`);
        if (error.response) {
          this.logger.error(
            `Error response data: ${JSON.stringify(error.response.data)}`,
          );
        }
      } else if (error instanceof Error) {
        this.logger.error(`An unexpected error occurred: ${error.message}`);
      } else {
        this.logger.error(
          `An unknown error occurred: ${JSON.stringify(error)}`,
        );
      }
      throw error;
    }
  }
}
