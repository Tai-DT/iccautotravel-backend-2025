import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { ChatbotService } from './chatbot.service';
import { RecommendationService } from './recommendation.service';
import { ContentGeneratorService } from './content-generator.service';
import { MockI18nService } from './mock-i18n.service';
import { GoogleAIService } from './google-ai.service';

@Module({
  providers: [
    AIService,
    ChatbotService,
    RecommendationService,
    ContentGeneratorService,
    MockI18nService,
    GoogleAIService,
  ],
  controllers: [AIController],
  exports: [
    AIService,
    ChatbotService,
    RecommendationService,
    ContentGeneratorService,
    GoogleAIService,
  ],
})
export class AIModule {}
