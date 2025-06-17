import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GoongService {
  private readonly logger = new Logger(GoongService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GOONG_API_KEY');
    if (!apiKey) {
      throw new Error('GOONG_API_KEY is not defined');
    }
    this.apiKey = apiKey;

    // Sử dụng GOONG_API_URL từ config, fallback về URL mặc định
    this.baseUrl =
      this.configService.get<string>('GOONG_API_URL') ||
      'https://rsapi.goong.io';
    this.logger.log(`Goong API URL: ${this.baseUrl}`);
  }

  async geocode(address: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Geocode`, {
          params: {
            address,
            api_key: this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Geocoding error: ${error.message}`);
      } else {
        this.logger.error(`Geocoding error: Unknown error`);
      }
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Geocode/reverse`, {
          params: {
            latlng: `${lat},${lng}`,
            api_key: this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Reverse geocoding error: ${error.message}`);
      } else {
        this.logger.error(`Reverse geocoding error: Unknown error`);
      }
      throw error;
    }
  }

  async getDirections(
    origin: string,
    destination: string,
    waypoints?: string[],
  ) {
    try {
      const params: any = {
        origin,
        destination,
        api_key: this.apiKey,
        vehicle: 'car',
      };

      if (waypoints && waypoints.length > 0) {
        params.waypoints = waypoints.join('|');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Direction`, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Directions error: ${error.message}`);
      } else {
        this.logger.error(`Directions error: Unknown error`);
      }
      throw error;
    }
  }

  async searchPlaces(keyword: string, location?: string, radius?: number) {
    try {
      const params: any = {
        keyword,
        api_key: this.apiKey,
      };

      if (location) {
        params.location = location;
      }

      if (radius) {
        params.radius = radius;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Place/search`, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Places search error: ${error.message}`);
      } else {
        this.logger.error(`Places search error: Unknown error`);
      }
      throw error;
    }
  }

  async getPlaceDetail(placeId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Place/detail`, {
          params: {
            place_id: placeId,
            api_key: this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Place detail error: ${error.message}`);
      } else {
        this.logger.error(`Place detail error: Unknown error`);
      }
      throw error;
    }
  }

  async autoComplete(input: string, location?: string) {
    try {
      const params: any = {
        input,
        api_key: this.apiKey,
      };

      if (location) {
        params.location = location;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/Place/autocomplete`, { params }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Autocomplete error: ${error.message}`);
      } else {
        this.logger.error(`Autocomplete error: Unknown error`);
      }
      throw error;
    }
  }
}
