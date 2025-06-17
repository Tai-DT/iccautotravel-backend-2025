import { ObjectType, Field } from '@nestjs/graphql';
import { ItineraryEntity } from './itinerary.entity';
import { GeneratedItineraryEntity } from './generated-itinerary.entity';

@ObjectType()
export class ItineraryResponseEntity {
  @Field(() => ItineraryEntity)
  itinerary!: ItineraryEntity;

  @Field(() => GeneratedItineraryEntity)
  generatedContent!: GeneratedItineraryEntity;
}
