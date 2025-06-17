import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GoogleAIService {
  private readonly logger = new Logger(GoogleAIService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-pro';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not defined');
    }
    this.apiKey = apiKey;
  }

  async generateTravelSuggestions(params: {
    origin: string;
    destination: string;
    startDate?: Date;
    endDate?: Date;
    preferences?: string[];
    budget?: number;
    travelType?: string;
  }) {
    try {
      const {
        origin,
        destination,
        startDate,
        endDate,
        preferences,
        budget,
        travelType,
      } = params;

      let prompt = `Generate a detailed travel itinerary from ${origin} to ${destination}`;

      if (startDate && endDate) {
        const days = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        prompt += ` for a ${days}-day trip starting on ${startDate.toISOString().split('T')[0]}`;
      }

      if (preferences && preferences.length > 0) {
        prompt += `. Preferences include: ${preferences.join(', ')}`;
      }

      if (budget) {
        prompt += `. Budget: approximately ${budget} VND`;
      }

      if (travelType) {
        prompt += `. Travel type: ${travelType}`;
      }

      prompt += `. Include recommended attractions, restaurants, accommodations, and transportation options. Format the response as JSON with the following structure:
      {
        "summary": "Brief overview of the trip",
        "days": [
          {
            "day": 1,
            "date": "YYYY-MM-DD",
            "activities": [
              {
                "time": "HH:MM",
                "activity": "Description of activity",
                "location": "Name of location",
                "type": "ATTRACTION/RESTAURANT/HOTEL/TRANSPORT",
                "notes": "Additional information"
              }
            ]
          }
        ],
        "recommendations": {
          "attractions": ["List of must-see attractions"],
          "restaurants": ["List of recommended restaurants"],
          "accommodations": ["List of recommended hotels"],
          "tips": ["List of travel tips"]
        }
      }`;

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          },
        ),
      );

      const textResponse = response.data.candidates[0].content.parts[0].text;

      // Extract JSON from the response
      const jsonMatch =
        textResponse.match(/```json\n([\s\S]*?)\n```/) ||
        textResponse.match(/{[\s\S]*}/);

      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e: unknown) {
          if (e instanceof Error) {
            this.logger.error(`Failed to parse JSON: ${e.message}`);
          } else {
            this.logger.error(`Failed to parse JSON: Unknown error`);
          }
          return {
            error: 'Failed to parse AI response',
            rawResponse: textResponse,
          };
        }
      }

      return {
        error: 'No valid JSON found in response',
        rawResponse: textResponse,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Google AI error: ${error.message}`);
      } else {
        this.logger.error(`Google AI error: Unknown error`);
      }
      throw error;
    }
  }

  async generatePlaceDescription(placeName: string, context?: string) {
    try {
      let prompt = `Generate a detailed and engaging description of ${placeName}`;

      if (context) {
        prompt += ` in the context of ${context}`;
      }

      prompt += `. Include historical significance, cultural importance, and why tourists should visit. Format the response as JSON with the following structure:
      {
        "name": "${placeName}",
        "description": "Detailed description",
        "highlights": ["List of key highlights"],
        "bestTimeToVisit": "When to visit",
        "tips": ["List of visitor tips"]
      }`;

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          },
        ),
      );

      const textResponse = response.data.candidates[0].content.parts[0].text;

      // Extract JSON from the response
      const jsonMatch =
        textResponse.match(/```json\n([\s\S]*?)\n```/) ||
        textResponse.match(/{[\s\S]*}/);

      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e: unknown) {
          if (e instanceof Error) {
            this.logger.error(`Failed to parse JSON: ${e.message}`);
          } else {
            this.logger.error(`Failed to parse JSON: Unknown error`);
          }
          return {
            error: 'Failed to parse AI response',
            rawResponse: textResponse,
          };
        }
      }

      return {
        error: 'No valid JSON found in response',
        rawResponse: textResponse,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Google AI error: ${error.message}`);
      } else {
        this.logger.error(`Google AI error: Unknown error`);
      }
      throw error;
    }
  }
}
