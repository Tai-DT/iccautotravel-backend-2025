import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';

@Controller('itinerary')
export class ItineraryController {
  private readonly logger = new Logger(ItineraryController.name);

  constructor(private readonly itineraryService: ItineraryService) {}

  @Post('generate')
  async generateItinerary(@Body() createItineraryDto: CreateItineraryDto) {
    this.logger.log(
      `Generating itinerary: ${JSON.stringify(createItineraryDto)}`,
    );

    try {
      const result =
        await this.itineraryService.generateItinerary(createItineraryDto);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generating itinerary: ${errorMessage}`);
      throw error;
    }
  }

  @Post('create-with-ai')
  async createWithAI(@Body() body: CreateItineraryDto & { userId: string }) {
    this.logger.log(`Creating AI itinerary for user: ${body.userId}`);

    try {
      const { userId, ...createItineraryDto } = body;
      const result = await this.itineraryService.createWithAI(
        createItineraryDto,
        userId,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating AI itinerary: ${errorMessage}`);
      throw error;
    }
  }
}
