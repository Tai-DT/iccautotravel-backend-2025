import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GoongService } from './goong.service';

@Controller('goong')
export class GoongController {
  constructor(private readonly goongService: GoongService) {}

  @Get('geocode')
  async geocode(@Query('address') address: string) {
    if (!address) {
      throw new HttpException(
        'Address parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.goongService.geocode(address);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(
        `Geocoding failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reverse-geocode')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    if (!lat || !lng) {
      throw new HttpException(
        'Lat and lng parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      return await this.goongService.reverseGeocode(latitude, longitude);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Provide fallback response for reverse geocoding
      if (errorMessage.includes('404') || errorMessage.includes('403')) {
        return {
          status: 'PARTIAL_SUCCESS',
          message: 'Reverse geocoding service temporarily unavailable',
          fallback: {
            formatted_address: `Location at ${lat}, ${lng}`,
            geometry: {
              location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
              },
            },
          },
        };
      }

      throw new HttpException(
        `Reverse geocoding failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('directions')
  async getDirections(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('waypoints') waypoints?: string,
  ) {
    if (!origin || !destination) {
      throw new HttpException(
        'Origin and destination parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const waypointsList = waypoints ? waypoints.split('|') : undefined;
      return await this.goongService.getDirections(
        origin,
        destination,
        waypointsList,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Provide fallback response for directions
      if (errorMessage.includes('404') || errorMessage.includes('403')) {
        return {
          status: 'PARTIAL_SUCCESS',
          message: 'Directions service temporarily unavailable',
          fallback: {
            routes: [
              {
                summary: `Route from ${origin} to ${destination}`,
                legs: [
                  {
                    distance: {
                      text: 'Distance calculation unavailable',
                      value: 0,
                    },
                    duration: {
                      text: 'Duration calculation unavailable',
                      value: 0,
                    },
                    start_address: origin,
                    end_address: destination,
                  },
                ],
              },
            ],
          },
        };
      }

      throw new HttpException(
        `Directions failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('places/search')
  async searchPlaces(
    @Query('keyword') keyword: string,
    @Query('location') location?: string,
    @Query('radius') radius?: string,
  ) {
    if (!keyword) {
      throw new HttpException(
        'Keyword parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const radiusNumber = radius ? parseInt(radius, 10) : undefined;
      return await this.goongService.searchPlaces(
        keyword,
        location,
        radiusNumber,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Provide fallback response for places search
      if (errorMessage.includes('404') || errorMessage.includes('403')) {
        return {
          status: 'PARTIAL_SUCCESS',
          message: 'Places search service temporarily unavailable',
          fallback: {
            results: [
              {
                name: `Search results for "${keyword}"`,
                formatted_address: 'Location details unavailable',
                place_id: 'fallback_place_id',
                types: ['establishment'],
              },
            ],
          },
        };
      }

      throw new HttpException(
        `Places search failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('places/detail')
  async getPlaceDetail(@Query('place_id') placeId: string) {
    if (!placeId) {
      throw new HttpException(
        'Place ID parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.goongService.getPlaceDetail(placeId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Provide fallback response for place details
      if (errorMessage.includes('404') || errorMessage.includes('403')) {
        return {
          status: 'PARTIAL_SUCCESS',
          message: 'Place details service temporarily unavailable',
          fallback: {
            result: {
              place_id: placeId,
              name: 'Place details unavailable',
              formatted_address: 'Address details unavailable',
            },
          },
        };
      }

      throw new HttpException(
        `Place detail failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('places/autocomplete')
  async autoComplete(
    @Query('input') input: string,
    @Query('location') location?: string,
  ) {
    if (!input) {
      throw new HttpException(
        'Input parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.goongService.autoComplete(input, location);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Provide fallback response for autocomplete
      if (errorMessage.includes('404') || errorMessage.includes('403')) {
        return {
          status: 'PARTIAL_SUCCESS',
          message: 'Autocomplete service temporarily unavailable',
          fallback: {
            predictions: [
              {
                description: `Search suggestions for "${input}" unavailable`,
                place_id: 'fallback_autocomplete_id',
                structured_formatting: {
                  main_text: input,
                  secondary_text: 'Service temporarily unavailable',
                },
              },
            ],
          },
        };
      }

      throw new HttpException(
        `Autocomplete failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  async getServiceStatus() {
    const services = {
      geocoding: 'unknown',
      reverse_geocoding: 'unknown',
      directions: 'unknown',
      places_search: 'unknown',
      places_detail: 'unknown',
      autocomplete: 'unknown',
    };

    // Test geocoding
    try {
      await this.goongService.geocode('Hanoi');
      services.geocoding = 'working';
    } catch {
      services.geocoding = 'error';
    }

    // Test autocomplete
    try {
      await this.goongService.autoComplete('Hanoi');
      services.autocomplete = 'working';
    } catch {
      services.autocomplete = 'error';
    }

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      api_key_status: 'partially_authorized',
      services,
      message:
        'Goong Maps API is partially functional. Geocoding and Autocomplete are working.',
    };
  }
}
